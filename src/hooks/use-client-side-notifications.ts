
'use client';

import { useEffect, useRef } from 'react';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { useFirestore, useUser } from '@/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { firebaseConfig } from '@/firebase/config';

async function requestNotificationPermission(userId: string, firestore: any) {
  if (!('Notification' in window) || !('serviceWorker' in navigator)) {
    console.warn("This browser does not support desktop notification or service workers.");
    return;
  }

  const permission = await Notification.requestPermission();
  if (permission === 'granted') {
    const messaging = getMessaging();
    try {
      const currentToken = await getToken(messaging, { vapidKey: firebaseConfig.apiKey });
      if (currentToken) {
        console.log('FCM Token:', currentToken);
        const tokenRef = doc(firestore, `users/${userId}/fcmTokens/${currentToken}`);
        await setDoc(tokenRef, {
          token: currentToken,
          userId: userId,
          createdAt: new Date().toISOString(),
        });
      } else {
        console.log('No registration token available. Request permission to generate one.');
      }
    } catch (err) {
      console.error('An error occurred while retrieving token. ', err);
    }
  }
}

export function useClientSideNotifications() {
  const { user } = useUser();
  const firestore = useFirestore();

  useEffect(() => {
    if (user && firestore) {
      requestNotificationPermission(user.uid, firestore);
    }
  }, [user, firestore]);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      const messaging = getMessaging();
      const unsubscribe = onMessage(messaging, (payload) => {
        console.log('Message received. ', payload);
        // We can handle foreground notifications here if needed,
        // but the service worker handles background notifications.
      });

      return () => unsubscribe();
    }
  }, []);
}
