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
import { useAuth, useUser } from "@/firebase";
import { initiateAnonymousSignIn } from "@/firebase/non-blocking-login";

const initialExpenses: Expense[] = [
    {
        id: '1',
        title: 'Netflix Subscription',
        amount: 15.99,
        dueDate: new Date(new Date().setDate(new Date().getDate() + 5)),
        category: 'Subscriptions',
        recurrence: 'Monthly',
        reminderTime: '10:00',
        status: 'Due',
    },
    {
        id: '2',
        title: 'Gym Membership',
        amount: 40,
        dueDate: new Date(new Date().setDate(new Date().getDate() - 2)),
        category: 'Health',
        recurrence: 'Monthly',
        reminderTime: '08:00',
        status: 'Due',
    },
    {
        id: '3',
        title: 'Internet Bill',
        amount: 60,
        dueDate: new Date(new Date().setDate(new Date().getDate() + 10)),
        category: 'Utilities',
        recurrence: 'One-off',
        reminderTime: '18:00',
        status: 'Paid',
    }
]

function AuthAwareHome() {
  const { toast } = useToast();
  
  const [expenses, setExpenses] = useState<Expense[]>(initialExpenses);
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
    if (deletingExpenseId) {
      setExpenses(prev => prev.filter(e => e.id !== deletingExpenseId));
      setDeletingExpenseId(null);
      toast({
        title: "Expense Deleted",
        description: "The expense has been successfully removed.",
      });
    }
  };

  const handleSaveExpense = async (expenseData: Omit<Expense, "id" | "status">) => {
    if (editingExpense) {
      // Update existing expense
      setExpenses(prev => prev.map(e => e.id === editingExpense.id ? { ...editingExpense, ...expenseData } : e));
      toast({
        title: "Expense Updated",
        description: `"${expenseData.title}" has been updated.`,
      });
    } else {
      // Add new expense
      const newExpense: Expense = {
          ...expenseData,
          id: Date.now().toString(),
          status: 'Due',
      };
      setExpenses(prev => [...prev, newExpense]);
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
      let expenseToUpdate: Expense | undefined;
      setExpenses(prev => {
        const newExpenses = [...prev];
        const expenseIndex = newExpenses.findIndex(e => e.id === id);
        
        if (expenseIndex === -1) return prev;

        expenseToUpdate = { ...newExpenses[expenseIndex] };
        expenseToUpdate.status = status;

        if (status === "Snoozed") {
          const snoozeUntil = new Date();
          snoozeUntil.setHours(snoozeUntil.getHours() + 1);
          expenseToUpdate.snoozeUntil = snoozeUntil;
        } else {
          expenseToUpdate.snoozeUntil = undefined;
        }
        
        newExpenses[expenseIndex] = expenseToUpdate;

        if (status === "Paid" && expenseToUpdate.recurrence === "Monthly") {
          const newDueDate = addMonths(expenseToUpdate.dueDate, 1);
          const newRecurringExpense: Expense = {
            ...expenseToUpdate,
            id: Date.now().toString(),
            dueDate: newDueDate,
            status: "Due",
            snoozeUntil: undefined,
          };
          newExpenses.push(newRecurringExpense);
          toast({
            title: "Next Bill Scheduled",
            description: `Next payment for "${newRecurringExpense.title}" is due on ${newDueDate.toLocaleDateString()}.`,
          });
        }
        
        return newExpenses;
      });

      if (expenseToUpdate) {
        if (status === "Snoozed") {
          toast({
            title: "Reminder Snoozed",
            description: "We'll remind you again in an hour.",
          });
        } else if (status === "Paid") {
          toast({
            title: "Marked as Paid!",
            description: "Great job staying on top of your finances.",
          });
        }
      }
    },
    [toast]
  );

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

  const showReminder = useCallback(() => {
    const nextDue = upcomingExpenses.find((e) => e.dueDate >= new Date());
    if (nextDue) {
      toast({
        title: `Reminder: ${nextDue.title}`,
        description: `Your payment of $${nextDue.amount} is due soon.`,
        duration: Infinity, 
        action: (
          <div className="flex flex-col gap-2 w-full">
            <Button
              variant="secondary"
              size="sm"
              className="w-full"
              onClick={() => handleStatusChange(nextDue.id, "Snoozed")}
            >
              Snooze
            </Button>
            <Button
              variant="default"
              size="sm"
              className="w-full"
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
  
  // Effect to automatically update snoozed items that have become due
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      let changed = false;
      const updatedExpenses = expenses.map(e => {
        if (e.status === 'Snoozed' && e.snoozeUntil && e.snoozeUntil <= now) {
          changed = true;
          return { ...e, status: 'Due', snoozeUntil: undefined };
        }
        return e;
      });
      if (changed) {
        setExpenses(updatedExpenses);
      }
    }, 1000 * 60); // Check every minute
    
    return () => clearInterval(interval);
  }, [expenses]);


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

  if (isUserLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-gray-900">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return <AuthAwareHome />;
}
