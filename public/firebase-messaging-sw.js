// DO NOT USE 'use client'
// This file should not be bundled by Next.js

// Import the Firebase app and messaging packages
import { initializeApp } from 'firebase/app';
import { getMessaging } from 'firebase/messaging/sw';
import { getFirestore, doc, updateDoc, serverTimestamp } from 'firebase/firestore';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};


// Initialize Firebase
const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);
const firestore = getFirestore(app);

self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push Received.');
  const notificationData = event.data.json();
  const { title, body, data } = notificationData.notification;
  
  const options = {
    body: body,
    icon: '/icon-192x192.png',
    badge: '/badge-72x72.png',
    requireInteraction: true, // Keep notification open until user interaction
    data: data, // Pass along reminderId, userId etc.
    actions: [
      { action: 'snooze', title: 'Snooze (1 hr)' },
      { action: 'mark-as-paid', title: 'Mark as Paid' },
    ],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification click Received.');

  event.notification.close(); // Close the notification

  const { userId, reminderId } = event.notification.data;
  const action = event.action;

  if (!userId || !reminderId) {
    console.error("Missing userId or reminderId in notification data");
    return;
  }
  
  const reminderRef = doc(firestore, `users/${userId}/reminders/${reminderId}`);

  let updatePromise;

  if (action === 'snooze') {
    console.log(`[Service Worker] Snoozing reminder: ${reminderId}`);
    const snoozeUntil = new Date();
    snoozeUntil.setHours(snoozeUntil.getHours() + 1);
    updatePromise = updateDoc(reminderRef, {
      status: 'Snoozed',
      snoozeUntil: snoozeUntil,
    });

  } else if (action === 'mark-as-paid') {
    console.log(`[Service Worker] Marking reminder as paid: ${reminderId}`);
    updatePromise = updateDoc(reminderRef, {
      status: 'Paid',
    });
  } else {
    // This handles the case where the user clicks the notification body itself
    console.log('[Service Worker] Notification body clicked.');
    updatePromise = Promise.resolve(); // No action needed, just resolve
  }

  // Open the app when any part of the notification is clicked
  const openAppPromise = clients.openWindow('/');

  event.waitUntil(Promise.all([updatePromise, openAppPromise]));
});
