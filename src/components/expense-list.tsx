"use client";

import type { Expense } from "@/lib/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { categoryIcons } from "@/components/icons";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Edit, MoreVertical, Trash2 } from "lucide-react";
import { useMemo } from "react";

interface ExpenseListProps {
  expenses: Expense[];
  onEdit: (expense: Expense) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: "Paid" | "Snoozed" | "Due") => void;
}

function ExpenseItem({ expense, onEdit, onDelete }: { expense: Expense, onEdit: (expense: Expense) => void, onDelete: (id: string) => void }) {
  const Icon = categoryIcons[expense.category];
  const isOverdue = expense.dueDate < new Date() && expense.status === 'Due';

  return (
    <div className="flex items-center gap-4 py-3">
      <div className="bg-primary/10 p-3 rounded-full">
        <Icon className="w-6 h-6 text-primary" />
      </div>
      <div className="flex-grow">
        <p className="font-semibold">{expense.title}</p>
        <p className="text-sm text-gray-400">
          Due: {format(expense.dueDate, "MMM dd, yyyy")}
        </p>
        {isOverdue && <Badge variant="destructive" className="mt-1">Overdue</Badge>}
      </div>
      <div className="text-right">
        <p className="font-bold text-lg">
          ${expense.amount.toFixed(2)}
        </p>
      </div>
       <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => onEdit(expense)}>
            <Edit className="mr-2 h-4 w-4" />
            <span>Edit</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onDelete(expense.id)} className="text-destructive focus:text-destructive">
            <Trash2 className="mr-2 h-4 w-4" />
            <span>Delete</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
    return (
        <div className="text-center py-10 px-4">
            <p className="text-gray-500">{message}</p>
        </div>
    )
}

export default function ExpenseList({ expenses, onEdit, onDelete }: ExpenseListProps) {

  const { upcoming, history } = useMemo(() => {
    const now = new Date();
    const upcoming = expenses.filter(e => e.status === 'Due' || e.status === 'Snoozed');
    const history = expenses.filter(e => e.status === 'Paid');
    return { upcoming, history };
  }, [expenses]);
  
  return (
    <Tabs defaultValue="upcoming" className="w-full">
      <TabsList className="grid w-full grid-cols-2 bg-gray-800">
        <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
        <TabsTrigger value="history">History</TabsTrigger>
      </TabsList>
      <TabsContent value="upcoming">
        <Card className="bg-transparent border-0 shadow-none">
          <CardContent className="p-0">
            <div className="divide-y divide-gray-800">
              {upcoming.length > 0 ? upcoming.map((expense) => (
                <div key={expense.id} className="px-4">
                  <ExpenseItem expense={expense} onEdit={onEdit} onDelete={onDelete} />
                </div>
              )) : <EmptyState message="No upcoming payments. You're all set!" />}
            </div>
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="history">
        <Card className="bg-transparent border-0 shadow-none">
          <CardContent className="p-0">
             <div className="divide-y divide-gray-800">
              {history.length > 0 ? history.map((expense) => (
                 <div key={expense.id} className="px-4 opacity-60">
                    <ExpenseItem expense={expense} onEdit={onEdit} onDelete={onDelete} />
                  </div>
              )) : <EmptyState message="No payment history yet." />}
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
