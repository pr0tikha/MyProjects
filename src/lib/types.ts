export type ExpenseCategory =
  | "Housing"
  | "Utilities"
  | "Subscriptions"
  | "Insurance"
  | "Debt"
  | "Transportation"
  | "Food"
  | "Pet Care"
  | "Childcare"
  | "Business"
  | "Travel"
  | "Other";
  
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
