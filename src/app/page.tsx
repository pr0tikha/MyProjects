"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { Plus, Loader2 } from "lucide-react";
import { addMonths } from "date-fns";

import type { Expense } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/header";
import ExpenseList from "@/components/expense-list";
import ExpenseForm from "@/components/expense-form";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAuth, useUser, useFirestore, useMemoFirebase } from "@/firebase";
import { initiateAnonymousSignIn } from "@/firebase/non-blocking-login";
import { useClientSideNotifications } from "@/hooks/use-client-side-notifications";
import { useCollection } from "@/firebase/firestore/use-collection";
import { collection, doc, setDoc, addDoc, deleteDoc, Timestamp } from "firebase/firestore";

function AuthAwareHome() {
  const { toast } = useToast();
  const { user } = useUser();
  const firestore = useFirestore();

  const expensesQuery = useMemoFirebase(() => {
    if (!user) return null;
    return collection(firestore, `users/${user.uid}/expenseLogs`);
  }, [user, firestore]);
  
  const { data: rawExpenses, isLoading: isLoadingExpenses } = useCollection<Omit<Expense, 'dueDate' | 'snoozeUntil'> & { dueDate: Timestamp, snoozeUntil?: Timestamp }>(expensesQuery);

  const expenses: Expense[] = useMemo(() => {
    if (!rawExpenses) return [];
    return rawExpenses.map(e => ({
      ...e,
      dueDate: e.dueDate.toDate(),
      snoozeUntil: e.snoozeUntil ? e.snoozeUntil.toDate() : undefined,
    }));
  }, [rawExpenses]);

  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [deletingExpenseId, setDeletingExpenseId] = useState<string | null>(
    null
  );

  const handleStatusChange = useCallback(
    async (id: string, status: "Paid" | "Snoozed" | "Due") => {
      if (!user) return;
      const expenseIndex = expenses.findIndex(e => e.id === id);
      if (expenseIndex === -1) return;
      
      const expenseToUpdate = { ...expenses[expenseIndex] };
      expenseToUpdate.status = status;

      const expenseDocRef = doc(firestore, `users/${user.uid}/expenseLogs/${id}`);

      if (status === "Snoozed") {
        const snoozeUntil = new Date();
        snoozeUntil.setHours(snoozeUntil.getHours() + 1);
        expenseToUpdate.snoozeUntil = snoozeUntil;
        await setDoc(expenseDocRef, { ...expenseToUpdate, snoozeUntil: Timestamp.fromDate(snoozeUntil) }, { merge: true });
        toast({
          title: "Reminder Snoozed",
          description: "We'll remind you again in an hour.",
        });
      } else {
        expenseToUpdate.snoozeUntil = undefined;
        await setDoc(expenseDocRef, { ...expenseToUpdate, snoozeUntil: undefined }, { merge: true });
         if (status === "Paid") {
          toast({
            title: "Marked as Paid!",
            description: "Great job staying on top of your finances.",
          });
        }
      }

      if (status === "Paid" && expenseToUpdate.recurrence === "Monthly") {
        const newDueDate = addMonths(expenseToUpdate.dueDate, 1);
        const newRecurringExpense: Omit<Expense, 'id'> = {
          ...expenseToUpdate,
          dueDate: newDueDate,
          status: "Due",
          snoozeUntil: undefined,
        };
        // Add the new recurring expense to Firestore
        const newDocPayload = {
          ...newRecurringExpense,
          userId: user.uid,
          dueDate: Timestamp.fromDate(newDueDate),
        };
        delete (newDocPayload as any).id; // Firestore generates ID
        await addDoc(collection(firestore, `users/${user.uid}/expenseLogs`), newDocPayload);
        
        toast({
          title: "Next Bill Scheduled",
          description: `Next payment for "${newRecurringExpense.title}" is due on ${newDueDate.toLocaleDateString()}.`,
        });
      }
    },
    [user, firestore, expenses, toast]
  );

  useClientSideNotifications(expenses, (id, action) => {
    if (action === 'snooze') {
      handleStatusChange(id, 'Snoozed');
    } else if (action === 'mark-as-paid') {
      handleStatusChange(id, 'Paid');
    }
  });

  const handleAddClick = () => {
    setEditingExpense(null);
    setIsSheetOpen(true);
  };

  const handleEditClick = (expense: Expense) => {
    setEditingExpense(expense);
    setIsSheetOpen(true);
  };

  const handleDeleteClick = (id: string) => {
    setDeletingExpenseId(id);
  };

  const confirmDelete = async () => {
    if (deletingExpenseId && user) {
      const expenseDocRef = doc(firestore, `users/${user.uid}/expenseLogs/${deletingExpenseId}`);
      await deleteDoc(expenseDocRef);
      setDeletingExpenseId(null);
      toast({
        title: "Expense Deleted",
        description: "The expense has been successfully removed.",
      });
    }
  };

  const handleSaveExpense = async (expenseData: Omit<Expense, "id" | "status">) => {
    if (!user) return;
    
    if (editingExpense) {
      // Update existing expense in Firestore
      const expenseDocRef = doc(firestore, `users/${user.uid}/expenseLogs/${editingExpense.id}`);
      const updatedData = {
        ...expenseData,
        dueDate: Timestamp.fromDate(expenseData.dueDate),
      };
      await setDoc(expenseDocRef, updatedData, { merge: true });
      toast({
        title: "Expense Updated",
        description: `"${expenseData.title}" has been updated.`,
      });
    } else {
      // Add new expense to Firestore
      const newExpensePayload = {
        ...expenseData,
        userId: user.uid,
        status: 'Due' as const,
        dueDate: Timestamp.fromDate(expenseData.dueDate),
      };
      await addDoc(collection(firestore, `users/${user.uid}/expenseLogs`), newExpensePayload);
      toast({
        title: "Expense Added",
        description: `"${expenseData.title}" has been added to your log.`,
      });
    }
    setIsSheetOpen(false);
    setEditingExpense(null);
  };

  const sortedExpenses = useMemo(() => {
    return [...expenses].sort(
      (a, b) => a.dueDate.getTime() - b.dueDate.getTime()
    );
  }, [expenses]);

  const upcomingExpenses = useMemo(() => {
    const now = new Date();
    return sortedExpenses.filter(
      (e) => {
        const isDue = e.status === 'Due';
        const isSnoozedAndReady = e.status === 'Snoozed' && e.snoozeUntil && e.snoozeUntil <= now;
        return isDue || isSnoozedAndReady;
      }
    );
  }, [sortedExpenses]);
  
  // Effect to automatically update snoozed items that have become due
  useEffect(() => {
    const interval = setInterval(() => {
       if (!user) return;
      const now = new Date();
      expenses.forEach(e => {
        if (e.status === 'Snoozed' && e.snoozeUntil && e.snoozeUntil <= now) {
          const expenseDocRef = doc(firestore, `users/${user.uid}/expenseLogs/${e.id}`);
          setDoc(expenseDocRef, { status: 'Due', snoozeUntil: undefined }, { merge: true });
        }
      });
    }, 1000 * 60); // Check every minute
    
    return () => clearInterval(interval);
  }, [expenses, user, firestore]);

  if (isLoadingExpenses) {
     return (
      <div className="flex h-full w-full items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2">Loading expenses...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background text-foreground">
      <Header expenses={upcomingExpenses} />
      <div className="flex-grow p-4 space-y-4">
        <ExpenseList
          expenses={sortedExpenses}
          onEdit={handleEditClick}
          onDelete={handleDeleteClick}
          onStatusChange={handleStatusChange}
        />
      </div>
      <ExpenseForm
        isOpen={isSheetOpen}
        onOpenChange={setIsSheetOpen}
        onSave={handleSaveExpense}
        expense={editingExpense}
      />
      <AlertDialog
        open={!!deletingExpenseId}
        onOpenChange={() => setDeletingExpenseId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this
              expense from your log.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeletingExpenseId(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <Button
        onClick={handleAddClick}
        className="absolute bottom-6 right-6 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90"
        aria-label="Add new expense"
      >
        <Plus className="h-7 w-7" />
      </Button>
    </div>
  );
}

export default function Home() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const firestore = useFirestore();

  useEffect(() => {
    if (!user && !isUserLoading) {
      initiateAnonymousSignIn(auth);
    }
  }, [user, isUserLoading, auth]);

  // Create user document if it doesn't exist
  useEffect(() => {
    if (user) {
      const userDocRef = doc(firestore, "users", user.uid);
      setDoc(userDocRef, { id: user.uid, email: user.email || "anonymous" }, { merge: true });
    }
  }, [user, firestore]);

  if (isUserLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return <AuthAwareHome />;
}
