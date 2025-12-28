// A service worker file is required to show notifications when the app is in the background or closed.
// This is a placeholder for now, but it's necessary for Firebase Messaging to work.
// In a real app, this file would handle background notification logic.
importScripts('https://www.gstatic.com/firebasejs/11.9.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/11.9.1/firebase-messaging-compat.js');

// This config is intentionally partial and will be completed by the SDK
const firebaseConfig = {
    apiKey: "AIzaSyBUyLUm-N5kMKkdh6-jP44NF7cIUQTj1XM",
    authDomain: "studio-1298148667-cb437.firebaseapp.com",
    projectId: "studio-1298148667-cb437",
    storageBucket: "studio-1298148667-cb437.appspot.com",
    messagingSenderId: "39717104496",
    appId: "1:39717104496:web:e5efd3c79afb602d383db5"
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log(
    '[firebase-messaging-sw.js] Received background message ',
    payload
  );
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/favicon.ico'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
