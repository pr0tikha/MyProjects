import type { LucideIcon } from "lucide-react";
import { Home, Receipt, Shield, Landmark } from "lucide-react";
import type { ExpenseCategory } from "@/lib/types";

export const categoryIcons: { [key in ExpenseCategory]: LucideIcon } = {
  Rent: Home,
  Bill: Receipt,
  Policy: Shield,
  Other: Landmark,
};
