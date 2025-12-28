"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { Plus, Loader2 } from "lucide-react";
import { collection, doc, addDoc, updateDoc, deleteDoc } from "firebase/firestore";

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
import { useAuth, useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { initiateAnonymousSignIn } from "@/firebase/non-blocking-login";

function AuthAwareHome() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user } = useUser();

  const expensesQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return collection(firestore, `users/${user.uid}/reminders`);
  }, [user, firestore]);
  
  const { data: expenses, isLoading: isLoadingExpenses } = useCollection<Omit<Expense, 'id'>>(expensesQuery);

  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [deletingExpenseId, setDeletingExpenseId] = useState<string | null>(
    null
  );

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
    if (deletingExpenseId && user && firestore) {
      const docRef = doc(firestore, `users/${user.uid}/reminders/${deletingExpenseId}`);
      await deleteDoc(docRef);
      setDeletingExpenseId(null);
      toast({
        title: "Expense Deleted",
        description: "The expense has been successfully removed.",
      });
    }
  };

  const handleSaveExpense = async (expenseData: Omit<Expense, "id" | "status">) => {
    if (!user || !firestore) return;

    if (editingExpense) {
      // Update existing expense
      const docRef = doc(firestore, `users/${user.uid}/reminders/${editingExpense.id}`);
      await updateDoc(docRef, {
        ...expenseData,
        dueDate: expenseData.dueDate, // Ensure Date object is passed
      });
      toast({
        title: "Expense Updated",
        description: `"${expenseData.title}" has been updated.`,
      });
    } else {
      // Add new expense
      const collectionRef = collection(firestore, `users/${user.uid}/reminders`);
      await addDoc(collectionRef, {
        ...expenseData,
        status: "Due",
        userId: user.uid,
      });
      toast({
        title: "Expense Added",
        description: `"${expenseData.title}" has been added to your log.`,
      });
    }
    setIsSheetOpen(false);
    setEditingExpense(null);
  };

  const handleStatusChange = useCallback(
    async (id: string, status: "Paid" | "Snoozed" | "Due") => {
      if (!user || !firestore) return;
      const docRef = doc(firestore, `users/${user.uid}/reminders/${id}`);
      await updateDoc(docRef, { status });

      if (status === "Paid") {
        toast({
          title: "Marked as Paid!",
          description: "Great job staying on top of your finances.",
        });
      }
    },
    [user, firestore, toast]
  );

  const sortedExpenses = useMemo(() => {
    if (!expenses) return [];
    // Firestore Timestamps need to be converted to JS Dates
    const expensesWithDates = expenses.map(e => ({
      ...e,
      dueDate: (e.dueDate as any).toDate ? (e.dueDate as any).toDate() : e.dueDate,
    }));
    return [...expensesWithDates].sort(
      (a, b) => a.dueDate.getTime() - b.dueDate.getTime()
    );
  }, [expenses]);

  const upcomingExpenses = useMemo(() => {
    return sortedExpenses.filter(
      (e) => e.status === "Due" || e.status === "Snoozed"
    );
  }, [sortedExpenses]);

  const showReminder = useCallback(() => {
    const nextDue = upcomingExpenses.find((e) => e.dueDate >= new Date());
    if (nextDue) {
      toast({
        title: `Reminder: ${nextDue.title}`,
        description: `Your payment of $${nextDue.amount} is due soon.`,
        action: (
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handleStatusChange(nextDue.id, "Snoozed")}
            >
              Snooze
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={() => handleStatusChange(nextDue.id, "Paid")}
            >
              Mark Paid
            </Button>
          </div>
        ),
      });
    } else {
      toast({
        title: "All caught up!",
        description: "You have no upcoming due payments.",
      });
    }
  }, [upcomingExpenses, handleStatusChange, toast]);

  useEffect(() => {
    if (upcomingExpenses.length > 0) {
      const timer = setTimeout(() => {
        showReminder();
      }, 5000); // Show reminder 5 seconds after component mounts
      return () => clearTimeout(timer);
    }
  }, [showReminder, upcomingExpenses.length]);

  if (isLoadingExpenses) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-gray-900">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-900 text-gray-50">
      <Header onNotificationClick={showReminder} expenses={upcomingExpenses} />
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

  useEffect(() => {
    if (!user && !isUserLoading) {
      initiateAnonymousSignIn(auth);
    }
  }, [user, isUserLoading, auth]);

  if (isUserLoading || !user) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-gray-900">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return <AuthAwareHome />;
}
