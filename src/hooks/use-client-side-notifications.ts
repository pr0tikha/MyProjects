
'use client';

import { useEffect, useRef } from 'react';
import { Expense } from '@/lib/types';
import { format } from 'date-fns';

type NotificationAction = 'snooze' | 'mark-as-paid';

// A Map to keep track of which reminders have already had a notification shown for them
// This prevents spamming the user with notifications every minute for an overdue item.
const notifiedReminders = new Map<string, boolean>();

export function useClientSideNotifications(
  expenses: Expense[],
  onAction: (id: string, action: NotificationAction) => void
) {
  const onActionRef = useRef(onAction);
  onActionRef.current = onAction;

  useEffect(() => {
    // 1. Request permission as soon as the component mounts
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    // This function will be called every minute to check for due reminders
    const checkReminders = () => {
      if (!('Notification' in window) || Notification.permission !== 'granted') {
        return; // Exit if notifications are not supported or permitted
      }

      const now = new Date();
      const upcomingExpenses = expenses.filter(e => e.status === 'Due');

      for (const expense of upcomingExpenses) {
        const [hours, minutes] = expense.reminderTime.split(':').map(Number);
        const reminderDateTime = new Date(expense.dueDate);
        reminderDateTime.setHours(hours, minutes, 0, 0);

        // Check if the reminder time is in the past, but no more than a minute ago.
        // This ensures we catch the reminder right as it becomes due.
        const isDue =
          reminderDateTime <= now &&
          now.getTime() - reminderDateTime.getTime() < 60000;

        if (isDue && !notifiedReminders.has(expense.id)) {
          // Mark this reminder as notified to prevent re-triggering
          notifiedReminders.set(expense.id, true);

          // Construct and show the notification
          const notification = new Notification(`Payment Reminder: ${expense.title}`, {
            body: `Your payment of $${expense.amount.toFixed(2)} is due.`,
            icon: '/icons/icon-192x192.png',
            tag: expense.id, // Use the expense ID as a tag to allow replacement
            requireInteraction: true, // Keep notification on screen until user interacts
            
            // Note: Actions are not supported by all browsers/OS combinations
            actions: [
              { action: 'snooze', title: 'Snooze (1 Hour)' },
              { action: 'mark-as-paid', title: 'Mark as Paid' },
            ],
          });
          
          // This is a browser limitation workaround. The 'notificationclick' event
          // is handled by the service worker. When the app is in the foreground,
          // the service worker might not be active to handle the click.
          // This `onclose` logic is a fallback.
          notification.onclose = () => {
            // A custom property to track which action was clicked.
            // This is set by the service worker.
            if ((notification as any).lastAction) {
                onActionRef.current(expense.id, (notification as any).lastAction);
            }
          };
        }
      }
    };

    // Set up the interval to run the check every minute
    const intervalId = setInterval(checkReminders, 60000);

    // Clean up the interval when the component unmounts
    return () => clearInterval(intervalId);
  }, [expenses]); // Re-run the effect if the list of expenses changes

  useEffect(() => {
    // This effect handles clicks on notification actions from the service worker
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'NOTIFICATION_ACTION') {
        const { expenseId, action } = event.data.payload;
        onActionRef.current(expenseId, action);
      }
    };

    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.addEventListener('message', handleMessage);
    }
    
    return () => {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.removeEventListener('message', handleMessage);
        }
    };

  }, []);
}
