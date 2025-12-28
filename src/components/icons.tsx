import type { LucideIcon } from "lucide-react";
import {
  Home,
  Receipt,
  Shield,
  Landmark,
  Zap,
  Flame,
  CreditCard,
  Car,
  Utensils,
  Dog,
  Baby,
  Briefcase,
  Plane,
  MoreHorizontal,
  Wifi,
  Repeat,
  HeartPulse,
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
