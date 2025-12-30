import type { LucideIcon } from "lucide-react";
import {
  Home,
  Shield,
  CreditCard,
  Car,
  Utensils,
  Dog,
  Baby,
  Briefcase,
  Plane,
  MoreHorizontal,
  Repeat,
  HeartPulse,
  Zap,
} from "lucide-react";
import type { ExpenseCategory } from "@/lib/types";

export const categoryIcons: { [key in ExpenseCategory]: LucideIcon } = {
  Housing: Home,
  Utilities: Zap,
  Subscriptions: Repeat,
  Insurance: Shield,
  Debt: CreditCard,
  Transportation: Car,
  Food: Utensils,
  "Pet Care": Dog,
  Childcare: Baby,
  Business: Briefcase,
  Travel: Plane,
  Other: MoreHorizontal,
  Health: HeartPulse,
};
