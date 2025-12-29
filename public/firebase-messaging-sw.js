
// This file must be in the public folder.

// Give the service worker access to Firebase Messaging.
// Note that you can only use Firebase Messaging here, other Firebase services
// are not available in the service worker.
importScripts("https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js");

// Initialize the Firebase app in the service worker with your project's config
const firebaseConfig = {
  "projectId": "studio-1298148667-cb437",
  "appId": "1:39717104496:web:e5efd3c79afb602d383db5",
  "apiKey": "AIzaSyBUyLUm-N5kMKkdh6-jP44NF7cIUQTj1XM",
  "authDomain": "studio-1298148667-cb437.firebaseapp.com",
  "messagingSenderId": "39717104496"
};


firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

// Handle incoming messages when the app is in the background or terminated
messaging.onBackgroundMessage((payload) => {
  console.log(
    "[firebase-messaging-sw.js] Received background message ",
    payload
  );

  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: payload.notification.icon,
    requireInteraction: true,
    // Extract actions and data from the webpush config
    actions: payload.webpush.notification.actions,
    data: payload.webpush.notification.data,
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});


// Handle notification click events
self.addEventListener("notificationclick", (event) => {
  event.notification.close(); // Close the notification

  const expenseId = event.notification.data.expenseId;
  const action = event.action; // This will be 'snooze' or 'mark-as-paid'

  // If the user just clicks the notification body (not an action button)
  if (!action) {
    event.waitUntil(
      clients.openWindow('/')
    );
    return;
  }
  
  // Send a message to the client (the web app) to perform the action
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      // If the app is open, send a message to it
      for (const client of clientList) {
        client.postMessage({
          type: "NOTIFICATION_ACTION",
          payload: {
            expenseId: expenseId,
            action: action,
          },
        });
      }
      
      // Here you could also write directly to Firestore using fetch() to a Cloud Function
      // if you wanted to handle the case where the app is fully closed.
      // For now, we rely on the app being open in a tab to process the action.
    })
  );
});
