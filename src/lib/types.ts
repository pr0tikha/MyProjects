export type ExpenseCategory = "Rent" | "Bill" | "Policy" | "Other";
export type ExpenseRecurrence = "One-off" | "Monthly";
export type ExpenseStatus = "Due" | "Paid" | "Snoozed";

export interface Expense {
  id: string;
  title: string;
  amount: number;
  dueDate: Date;
  recurrence: ExpenseRecurrence;
  reminderTime: string;
  category: ExpenseCategory;
  status: ExpenseStatus;
}
