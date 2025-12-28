"use client";

import { getMessaging, getToken, isSupported } from "firebase/messaging";
import { collection, doc, serverTimestamp, setDoc, Firestore } from "firebase/firestore";
import { getFirebaseApp } from "@/firebase/provider"; // Assuming this hook exists to get the app instance

// This is the public key from your Firebase project settings.
const VAPID_KEY = "BA3ckzYn9atYSDjrxWHnImXnpDtb2SMJFcFPs397HxlTjS_1yjVWKYljtkw1zbAKOFJ2C05jd7Iznayj-vSKt90";

/**
 * Requests permission to show notifications and saves the token if granted.
 * @param firestore The Firestore instance.
 * @param userId The current user's ID.
 */
export const requestNotificationPermission = async (firestore: Firestore, userId: string) => {
  // Check for browser support first.
  if (!(await isSupported())) {
    console.warn("Firebase Messaging is not supported in this browser.");
    throw new Error("Notifications not supported.");
  }

  const permission = await Notification.requestPermission();

  if (permission === "granted") {
    const app = getFirebaseApp();
    const messaging = getMessaging(app);

    // Get the token.
    const fcmToken = await getToken(messaging, {
      vapidKey: VAPID_KEY,
    });

    if (fcmToken) {
      console.log("FCM Token:", fcmToken);
      // Save the token to Firestore
      const tokenRef = doc(firestore, `users/${userId}/fcmTokens/${fcmToken}`);
      await setDoc(tokenRef, {
        userId: userId,
        token: fcmToken,
        createdAt: serverTimestamp(),
      });
    } else {
      // This can happen if there's an issue with the service worker or VAPID key.
      console.error("Could not get FCM token.");
      throw new Error("Unable to get notification token.");
    }
  } else {
    console.warn("Notification permission denied.");
    throw new Error("Notification permission was denied.");
  }
};
