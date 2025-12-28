'use client';

import { Wallet } from 'lucide-react';
import type { Expense } from '@/lib/types';

interface HeaderProps {
  expenses: Expense[];
}

export default function Header({ expenses }: HeaderProps) {
  const totalUpcoming = expenses.reduce((sum, exp) => sum + exp.amount, 0);

  return (
    <header className="p-4 bg-gray-900 border-b border-gray-800 sticky top-0 z-10">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-primary">PayMind</h1>
      </div>
      <div className="flex items-center gap-4 bg-gray-800 p-4 rounded-lg">
        <div className="p-3 bg-primary/10 rounded-full">
          <Wallet className="w-6 h-6 text-primary" />
        </div>
        <div>
          <p className="text-sm text-gray-400">Upcoming Payments</p>
          <p className="text-xl font-semibold">${totalUpcoming.toFixed(2)}</p>
        </div>
      </div>
    </header>
  );
}
