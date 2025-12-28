
// Import the Firebase app and messaging services
import { initializeApp } from "firebase/app";
import { getMessaging } from "firebase/messaging/sw";

// **IMPORTANT:** This configuration is automatically replaced by a script
// with your project's specific details during the build process.
// You do not need to change it manually.
const firebaseConfig = {
  "projectId": "studio-1298148667-cb437",
  "appId": "1:39717104496:web:e5efd3c79afb602d383db5",
  "apiKey": "AIzaSyBUyLUm-N5kMKkdh6-jP44NF7cIUQTj1XM",
  "authDomain": "studio-1298148667-cb437.firebaseapp.com",
  "messagingSenderId": "39717104496"
};


// Initialize the Firebase app in the service worker
const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

// Handle background messages
// This is where we'll display the notification to the user
self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push Received.');
  const payload = event.data.json();
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/icon-192x192.png',
    badge: '/badge-72x72.png',
    // Make the notification sticky until the user interacts with it
    requireInteraction: true, 
    // Add the action buttons
    actions: [
      { action: 'snooze', title: 'Snooze (1 hour)' },
      { action: 'mark-as-paid', title: 'Mark as Paid' }
    ],
    // Store the reminder data to use when an action is clicked
    data: {
      reminderId: payload.data.reminderId,
      userId: payload.data.userId
    }
  };

  event.waitUntil(
    self.registration.showNotification(notificationTitle, notificationOptions)
  );
});


// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification click Received.');

  event.notification.close(); // Close the notification

  const { reminderId, userId } = event.notification.data;

  // This is a placeholder for the logic that will update Firestore.
  // We cannot directly use the Firestore SDK here in the same way as the client app.
  // A robust solution often involves sending this action to a server endpoint
  // or using a lightweight fetch to a Firebase Function to update the data.
  
  // For now, we will log the intended action.
  // In a full implementation, this would trigger an update in Firestore.

  switch (event.action) {
    case 'snooze':
      console.log(`User snoozed reminder: ${reminderId} for user: ${userId}`);
      // **Future implementation:** Send a request to a Firebase Function
      // to update the reminder's status to 'Snoozed' and set 'snoozeUntil'.
      break;
    case 'mark-as-paid':
      console.log(`User marked reminder as paid: ${reminderId} for user: ${userId}`);
      // **Future implementation:** Send a request to a Firebase Function
      // to update the reminder's status to 'Paid'.
      break;
    default:
      // This happens when the user clicks the notification body, not an action button.
      // We can open the app here.
      console.log('User clicked notification body. Opening app.');
      clients.openWindow('/');
      break;
  }
});
