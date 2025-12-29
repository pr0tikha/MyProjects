
'use client';

import { useEffect, useRef } from 'react';
import type { Expense } from '@/lib/types';

type NotificationAction = 'snooze' | 'mark-as-paid';

function requestNotificationPermission() {
  if (!('Notification' in window)) {
    console.warn("This browser does not support desktop notification");
    return;
  }
  Notification.requestPermission();
}

export function useClientSideNotifications(
  expenses: Expense[],
  onAction: (id: string, action: NotificationAction) => void
) {
  const onActionRef = useRef(onAction);
  onActionRef.current = onAction;

  // Request permission on mount
  useEffect(() => {
    requestNotificationPermission();
  }, []);

  useEffect(() => {
    const notifiedExpenses = new Set<string>();

    const checkReminders = () => {
      if (Notification.permission !== 'granted') {
        return;
      }
      
      const now = new Date();
      expenses.forEach(expense => {
        if (expense.status !== 'Due' || notifiedExpenses.has(expense.id)) {
          return;
        }

        const [hours, minutes] = expense.reminderTime.split(':').map(Number);
        const reminderDateTime = new Date(expense.dueDate);
        reminderDateTime.setHours(hours, minutes, 0, 0);

        // Check if the reminder time is in the past but within the last minute
        const timeDiff = now.getTime() - reminderDateTime.getTime();
        if (timeDiff > 0 && timeDiff < 60000) {
          
          const notification = new Notification(`Payment Reminder: ${expense.title}`, {
            body: `Your payment of $${expense.amount.toFixed(2)} is due today.`,
            requireInteraction: true,
            icon: '/icons/icon-192x192.png',
            actions: [
              { action: 'snooze', title: 'Snooze (1 Hour)' },
              { action: 'mark-as-paid', title: 'Mark as Paid' },
            ],
            data: { expenseId: expense.id }
          });
          
          notification.onclick = () => {
            window.focus();
          };

          notification.onclose = () => {
             // Handle case where user just closes notification
          };
          
          notifiedExpenses.add(expense.id);
        }
      });
    };

    const interval = setInterval(checkReminders, 60 * 1000); // Check every minute

    // Handle service worker messages for notification actions
    const handleMessage = (event: MessageEvent) => {
        if (event.data?.type === 'NOTIFICATION_ACTION') {
            const { expenseId, action } = event.data.payload;
            onActionRef.current(expenseId, action as NotificationAction);
        }
    };
    navigator.serviceWorker.addEventListener('message', handleMessage);

    return () => {
      clearInterval(interval);
      navigator.serviceWorker.removeEventListener('message', handleMessage);
    };
  }, [expenses]);
}
