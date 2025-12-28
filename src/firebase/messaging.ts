'use client';

import { getMessaging, getToken } from "firebase/messaging";
import { getApp } from "firebase/app";

export const requestNotificationPermission = async () => {
  const messaging = getMessaging(getApp());
  const permission = await Notification.requestPermission();
  
  if (permission === 'granted') {
    // This is a placeholder for the VAPID key.
    // In a real production environment, this should come from a secure source
    // and not be hardcoded. It's safe to use in the client-side `getToken` method.
    const vapidKey = "YOUR_VAPID_KEY_HERE"; // This will be replaced by your actual VAPID key
    
    try {
      const fcmToken = await getToken(messaging, { vapidKey });
      if (fcmToken) {
        return fcmToken;
      } else {
        console.warn('No registration token available. Request permission to generate one.');
        return null;
      }
    } catch (err) {
      console.error('An error occurred while retrieving token. ', err);
      return null;
    }
  } else {
    console.warn('Notification permission denied.');
    return null;
  }
};
