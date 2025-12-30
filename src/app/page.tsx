
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
import { useClientSideNotifications } from "@/hooks/use-client-side-notifications";

function Home() {
  const { toast } = useToast();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load expenses from localStorage on initial render
  useEffect(() => {
    try {
      const storedExpenses = localStorage.getItem("expenses");
      if (storedExpenses) {
        const parsedExpenses: Expense[] = JSON.parse(storedExpenses).map((e: Expense) => ({
          ...e,
          dueDate: new Date(e.dueDate),
          snoozeUntil: e.snoozeUntil ? new Date(e.snoozeUntil) : undefined,
        }));
        setExpenses(parsedExpenses);
      }
    } catch (error) {
      console.error("Failed to load expenses from localStorage", error);
    }
    setIsLoading(false);
  }, []);

  // Persist expenses to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem("expenses", JSON.stringify(expenses));
    } catch (error) {
      console.error("Failed to save expenses to localStorage", error);
    }
  }, [expenses]);
  
  // Use the client-side notification hook
  useClientSideNotifications({ expenses, onStatusChange: (id, status) => handleStatusChange(id, status, false) });


  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [deletingExpenseId, setDeletingExpenseId] = useState<string | null>(
    null
  );

  const handleStatusChange = useCallback(
    (id: string, status: "Paid" | "Snoozed" | "Due", showToast = true) => {
      const updatedExpenses = [...expenses];
      const expenseIndex = updatedExpenses.findIndex((e) => e.id === id);
      if (expenseIndex === -1) return;

      const expenseToUpdate = { ...updatedExpenses[expenseIndex] };
      
      if (status === "Snoozed") {
        expenseToUpdate.status = "Snoozed";
        const snoozeUntil = new Date();
        snoozeUntil.setHours(snoozeUntil.getHours() + 1);
        expenseToUpdate.snoozeUntil = snoozeUntil;
        updatedExpenses[expenseIndex] = expenseToUpdate;
        if (showToast) {
            toast({
            title: "Reminder Snoozed",
            description: "We'll remind you again in an hour.",
            });
        }
      } else {
        expenseToUpdate.status = status;
        expenseToUpdate.snoozeUntil = undefined;
        updatedExpenses[expenseIndex] = expenseToUpdate;
        if (status === "Paid" && showToast) {
          toast({
            title: "Marked as Paid!",
            description: "Great job staying on top of your finances.",
          });
        }
      }

      // Handle recurring expense
      if (status === "Paid" && expenseToUpdate.recurrence === "Monthly") {
        const newDueDate = addMonths(new Date(expenseToUpdate.dueDate), 1);
        const newRecurringExpense: Expense = {
          ...expenseToUpdate,
          id: crypto.randomUUID(),
          dueDate: newDueDate,
          status: "Due",
          snoozeUntil: undefined,
        };
        updatedExpenses.push(newRecurringExpense);
        if (showToast) {
            toast({
            title: "Next Bill Scheduled",
            description: `Next payment for "${newRecurringExpense.title}" is due on ${newDueDate.toLocaleDateString()}.`,
            });
        }
      }
      
      setExpenses(updatedExpenses);
    },
    [expenses, toast]
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

  const confirmDelete = () => {
    if (deletingExpenseId) {
      setExpenses(expenses.filter((e) => e.id !== deletingExpenseId));
      setDeletingExpenseId(null);
      toast({
        title: "Expense Deleted",
        description: "The expense has been successfully removed.",
      });
    }
  };

  const handleSaveExpense = (expenseData: Omit<Expense, "id" | "status">) => {
    if (editingExpense) {
      setExpenses(
        expenses.map((e) =>
          e.id === editingExpense.id ? { ...editingExpense, ...expenseData } : e
        )
      );
      toast({
        title: "Expense Updated",
        description: `"${expenseData.title}" has been updated.`,
      });
    } else {
      const newExpense: Expense = {
        ...expenseData,
        id: crypto.randomUUID(),
        status: "Due",
      };
      setExpenses([...expenses, newExpense]);
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
      (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
    );
  }, [expenses]);

  const upcomingExpenses = useMemo(() => {
    const now = new Date();
    return sortedExpenses.filter(
      (e) => {
        const isDue = e.status === 'Due';
        const isSnoozedAndReady = e.status === 'Snoozed' && e.snoozeUntil && new Date(e.snoozeUntil) <= now;
        return isDue || isSnoozedAndReady;
      }
    );
  }, [sortedExpenses]);
  
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      let needsUpdate = false;
      const updatedExpenses = expenses.map(e => {
        if (e.status === 'Snoozed' && e.snoozeUntil && new Date(e.snoozeUntil) <= now) {
          needsUpdate = true;
          return { ...e, status: 'Due' as const, snoozeUntil: undefined };
        }
        return e;
      });

      if (needsUpdate) {
        setExpenses(updatedExpenses);
      }
    }, 1000 * 60); // Check every minute
    
    return () => clearInterval(interval);
  }, [expenses]);


  if (isLoading) {
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
      <div className="flex-grow p-4 space-y-4 overflow-y-auto">
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

export default Home;
