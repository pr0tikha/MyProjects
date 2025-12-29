// This service worker script handles notification clicks.

self.addEventListener('notificationclick', (event) => {
  const notification = event.notification;
  const action = event.action; // This will be 'snooze' or 'mark-as-paid'

  // Set a custom property on the notification to track the action
  // This is a workaround for the main app to know what was clicked.
  (notification as any).lastAction = action;

  // Close the notification
  notification.close();

  // If the app's client windows are open, send them a message
  // so the UI can update immediately.
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      for (const client of clientList) {
        client.postMessage({
          type: 'NOTIFICATION_ACTION',
          payload: {
            expenseId: notification.tag,
            action: action,
          },
        });
      }
    })
  );
});
