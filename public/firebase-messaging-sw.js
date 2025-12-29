// Import and initialize the Firebase SDK
// This is a special import syntax for service workers
importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js");

// This is the config from your web app
const firebaseConfig = {
  "projectId": "studio-1298148667-cb437",
  "appId": "1:39717104496:web:e5efd3c79afb602d383db5",
  "apiKey": "AIzaSyBUyLUm-N5kMKkdh6-jP44NF7cIUQTj1XM",
  "authDomain": "studio-1298148667-cb437.firebaseapp.com",
  "measurementId": "",
  "messagingSenderId": "39717104496"
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

// This listener handles messages received when the app is in the background or closed.
messaging.onBackgroundMessage((payload) => {
  console.log(
    "[firebase-messaging-sw.js] Received background message ",
    payload
  );

  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: payload.notification.icon || '/icons/icon-192x192.png',
    requireInteraction: true, // Keep notification until user interacts
    data: {
      expenseId: payload.data.expenseId,
      // The URL to open when the notification is clicked
      click_action: payload.fcmOptions.link || payload.data.link || '/', 
    },
    actions: [
      { action: "snooze", title: "Snooze (1 Hour)" },
      { action: "mark-as-paid", title: "Mark as Paid" },
    ],
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// This listener handles clicks on the notification itself (the main body).
self.addEventListener("notificationclick", (event) => {
  event.notification.close(); // Close the notification

  const expenseId = event.notification.data.expenseId;
  const action = event.action;

  if (action) {
    // This is a click on an action button ("Snooze" or "Mark as Paid")
    console.log(`Action '${action}' for expenseId '${expenseId}'`);
    
    // Send a message to all open clients (app windows/tabs)
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        client.postMessage({
          type: "NOTIFICATION_ACTION",
          payload: {
            expenseId,
            action,
          },
        });
      }
    });

  } else {
    // This is a click on the notification body
    const openUrl = event.notification.data.click_action || "/";
    event.waitUntil(
      self.clients.matchAll({ type: "window" }).then((clientList) => {
        for (const client of clientList) {
          if (client.url === openUrl && "focus" in client) {
            return client.focus();
          }
        }
        if (self.clients.openWindow) {
          return self.clients.openWindow(openUrl);
        }
      })
    );
  }
});
