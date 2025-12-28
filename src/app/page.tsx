"use client";

import { useState, useMemo, useCallback } from "react";
import { Plus } from "lucide-react";

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

const initialExpenses: Expense[] = [
  {
    id: "1",
    title: "Monthly Rent",
    subCategory: "Rent",
    amount: 1500,
    dueDate: new Date(new Date().getFullYear(), new Date().getMonth(), 23),
    recurrence: "Monthly",
    reminderTime: "09:00",
    category: "Housing",
    status: "Due",
  },
  {
    id: "2",
    title: "Electricity Bill",
    amount: 75.5,
    dueDate: new Date(new Date().getFullYear(), new Date().getMonth(), 15),
    recurrence: "Monthly",
    reminderTime: "18:00",
    category: "Utilities",
    status: "Due",
  },
  {
    id: "3",
    title: "Car Insurance",
    amount: 120,
    dueDate: new Date(new Date().getFullYear(), new Date().getMonth() - 1, 28),
    recurrence: "Monthly",
    reminderTime: "12:00",
    category: "Insurance",
    status: "Paid",
  },
  {
    id: '4',
    title: 'Gym Membership',
    amount: 40,
    dueDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 5),
    recurrence: 'Monthly',
    reminderTime: '08:00',
    category: 'Subscriptions',
    status: 'Due'
  }
];

export default function Home() {
  const { toast } = useToast();
  const [expenses, setExpenses] = useState<Expense[]>(initialExpenses);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [deletingExpenseId, setDeletingExpenseId] = useState<string | null>(null);

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
      setExpenses((prev) => prev.filter((exp) => exp.id !== deletingExpenseId));
      setDeletingExpenseId(null);
      toast({
        title: "Expense Deleted",
        description: "The expense has been successfully removed.",
      });
    }
  };

  const handleSaveExpense = (expenseData: Omit<Expense, "id" | "status">) => {
    if (editingExpense) {
      // Update existing expense
      const updatedExpense: Expense = { ...editingExpense, ...expenseData };
      setExpenses((prev) =>
        prev.map((exp) => (exp.id === editingExpense.id ? updatedExpense : exp))
      );
      toast({
        title: "Expense Updated",
        description: `"${expenseData.title}" has been updated.`,
      });
    } else {
      // Add new expense
      const newExpense: Expense = {
        id: Date.now().toString(),
        ...expenseData,
        status: "Due",
      };
      setExpenses((prev) => [...prev, newExpense]);
      toast({
        title: "Expense Added",
        description: `"${expenseData.title}" has been added to your log.`,
      });
    }
    setIsSheetOpen(false);
    setEditingExpense(null);
  };

  const handleStatusChange = useCallback(
    (id: string, status: "Paid" | "Snoozed" | "Due") => {
      setExpenses((prev) =>
        prev.map((exp) => (exp.id === id ? { ...exp, status } : exp))
      );
      if (status === "Paid") {
        toast({
          title: "Marked as Paid!",
          description: "Great job staying on top of your finances.",
        });
      }
    },
    [toast]
  );
  
  const sortedExpenses = useMemo(() => {
    return [...expenses].sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
  }, [expenses]);

  const handleNotification = () => {
    const nextDue = sortedExpenses.find(e => e.status === 'Due' && e.dueDate >= new Date());
    if (nextDue) {
      toast({
        title: `Reminder: ${nextDue.title}`,
        description: `Your payment of $${nextDue.amount} is due soon.`,
        action: (
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={() => handleStatusChange(nextDue.id, "Snoozed")}>
              Snooze
            </Button>
            <Button variant="default" size="sm" onClick={() => handleStatusChange(nextDue.id, "Paid")}>
              Mark Paid
            </Button>
          </div>
        )
      });
    } else {
      toast({
        title: "All caught up!",
        description: "You have no upcoming due payments.",
      });
    }
  };

  return (
    <div className="flex flex-col h-full">
      <Header onNotificationClick={handleNotification} />
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
      <AlertDialog open={!!deletingExpenseId} onOpenChange={() => setDeletingExpenseId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this expense from your log.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeletingExpenseId(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <Button
        onClick={handleAddClick}
        className="absolute bottom-6 right-6 h-14 w-14 rounded-full bg-accent text-accent-foreground shadow-lg hover:bg-accent/90"
        aria-label="Add new expense"
      >
        <Plus className="h-7 w-7" />
      </Button>
    </div>
  );
}
