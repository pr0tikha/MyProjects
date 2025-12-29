'use client';

import { Wallet } from 'lucide-react';
import type { Expense } from '@/lib/types';

interface HeaderProps {
  expenses: Expense[];
}

export default function Header({ expenses }: HeaderProps) {
  const totalUpcoming = expenses.reduce((sum, exp) => sum + exp.amount, 0);

  return (
    <header className="p-6 bg-background border-b border-border sticky top-0 z-10">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-primary">PayMind</h1>
          <p className="text-sm text-muted-foreground">Welcome to your personal reminder app.</p>
        </div>
      </div>
      <div className="flex items-center gap-4 bg-muted p-4 rounded-lg">
        <div className="p-3 bg-primary/10 rounded-full">
          <Wallet className="w-6 h-6 text-primary" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Total Upcoming</p>
          <p className="text-2xl font-semibold">${totalUpcoming.toFixed(2)}</p>
        </div>
      </div>
    </header>
  );
}
