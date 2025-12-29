
'use client';

import { useEffect, useRef } from 'react';
import type { Expense } from '@/lib/types';
import { useUser } from '@/firebase';
import { getMessaging, getToken, onMessage } from "firebase/messaging";
import { useFirestore } from '@/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';


type NotificationAction = 'snooze' | 'mark-as-paid';

async function requestNotificationPermission(userId: string, firestore: any) {
  if (!('Notification' in window) || !('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.warn("Push notifications not supported in this browser.");
    return;
  }

  const permission = await Notification.requestPermission();
  if (permission === 'granted') {
    const messaging = getMessaging();
    // VAPID key is a public key, safe to include here. It's for identifying the application server.
    const vapidKey = "BPE3J35p5qr7gWz2I9n2AYp1yA8l4V0pDOR2cT1I8V6JqGf-q8nJmGvX_gXh_x-0aC6i3r5aK_yVl4eF9p3n4M0";
    try {
      const currentToken = await getToken(messaging, { vapidKey });
      if (currentToken) {
        // Save the token to Firestore
        const tokenRef = doc(firestore, `users/${userId}/fcmTokens`, currentToken);
        await setDoc(tokenRef, { 
          token: currentToken, 
          userId: userId,
          createdAt: serverTimestamp() 
        });
        console.log('FCM Token saved to Firestore.');
      } else {
        console.log('No registration token available. Request permission to generate one.');
      }
    } catch (err) {
      console.error('An error occurred while retrieving token. ', err);
    }
  } else {
    console.log('Notification permission denied.');
  }
}


export function useClientSideNotifications(
  expenses: Expense[],
  onAction: (id: string, action: NotificationAction) => void
) {
  const onActionRef = useRef(onAction);
  onActionRef.current = onAction;

  const { user } = useUser();
  const firestore = useFirestore();

  useEffect(() => {
    if (user) {
      requestNotificationPermission(user.uid, firestore);
    }
  }, [user, firestore]);


  useEffect(() => {
    if ('serviceWorker' in navigator) {
      const handleMessage = (event: MessageEvent) => {
        if (event.data?.type === 'NOTIFICATION_ACTION') {
          const { expenseId, action } = event.data.payload;
          onActionRef.current(expenseId, action as NotificationAction);
        }
      };
      
      navigator.serviceWorker.addEventListener('message', handleMessage);

      // Listen for foreground messages
      const messaging = getMessaging();
      const unsubscribe = onMessage(messaging, (payload) => {
        console.log('Foreground message received.', payload);
        // Here you could show an in-app toast notification instead of a system notification
      });

      return () => {
        navigator.serviceWorker.removeEventListener('message', handleMessage);
        unsubscribe();
      };
    }
  }, []);
}
