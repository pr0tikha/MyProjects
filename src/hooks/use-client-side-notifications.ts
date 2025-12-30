'use client';

import { useEffect, useRef } from 'react';
import type { Expense, ExpenseStatus } from '@/lib/types';

interface UseNotificationsProps {
    expenses: Expense[];
    onStatusChange: (id: string, status: ExpenseStatus, showToast: boolean) => void;
}

// Helper to get time in HH:mm format
const getHhMm = (date: Date) => {
  return date.toTimeString().slice(0, 5);
};

export function useClientSideNotifications({ expenses, onStatusChange: _onStatusChange }: UseNotificationsProps) {
  const lastCheckedTimeRef = useRef<string | null>(null);

  useEffect(() => {
    if (!('Notification' in globalThis)) {
      console.warn('This browser does not support desktop notification.');
      return;
    }

    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    const checkReminders = () => {
      if (Notification.permission !== 'granted') {
        return;
      }
      
      const now = new Date();
      const currentTime = getHhMm(now);
      
      // Avoid re-checking in the same minute
      if (currentTime === lastCheckedTimeRef.current) {
        return;
      }
      lastCheckedTimeRef.current = currentTime;

      expenses.forEach((expense) => {
        if (expense.status === 'Due') {
          const dueDate = new Date(expense.dueDate);
          const isToday = dueDate.toDateString() === now.toDateString();
          const reminderTime = expense.reminderTime; // "HH:mm"

          if (isToday && reminderTime === currentTime) {
            showNotification(expense);
          }
        }
      });
    };

    const interval = setInterval(checkReminders, 1000 * 60); // Check every minute

    return () => clearInterval(interval);
  }, [expenses]);


  const showNotification = (expense: Expense) => {
    const notification = new Notification(`Payment Reminder: ${expense.title}`, {
      body: `Your payment of $${expense.amount.toFixed(2)} is due today.`,
      icon: '/icons/icon-192x192.png',
      requireInteraction: true, // Makes the notification sticky
      data: { expenseId: expense.id },
      actions: [
        { action: 'snooze', title: 'Snooze (1 Hour)' },
        { action: 'mark-as-paid', title: 'Mark as Paid' },
      ],
    });

    notification.onclick = () => {
        globalThis.focus();
    };

    // Note: Notification action clicks are not directly handled in modern browsers.
    // This is a limitation of a purely client-side implementation.
    // For full interactivity when the app is closed, a service worker is needed,
    // which typically involves a push service. This implementation provides
    // basic reminders when the app is open in a tab.
  };

  // This hook now focuses on in-browser logic and does not need to return anything.
}
