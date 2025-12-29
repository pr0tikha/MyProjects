import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { Timestamp } from "firebase-admin/firestore";

admin.initializeApp();

const db = admin.firestore();

// Scheduled function to check for due reminders every 5 minutes
export const checkReminders = functions.pubsub
  .schedule("every 5 minutes")
  .onRun(async (context) => {
    console.log("Checking for due reminders...");

    const now = new Date();
    const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);

    const querySnapshot = await db.collectionGroup("expenseLogs")
      .where("status", "==", "Due")
      .get();

    const promises = querySnapshot.docs.map(async (doc) => {
      const expense = doc.data();
      const dueDate = (expense.dueDate as Timestamp).toDate();
      const reminderTime = expense.reminderTime; // "HH:mm"

      if (!reminderTime) {
        return;
      }
      
      const [hours, minutes] = reminderTime.split(":").map(Number);
      const reminderDateTime = new Date(dueDate);
      reminderDateTime.setHours(hours, minutes, 0, 0);

      // Check if the reminder time is within the next 5-minute window
      if (reminderDateTime >= now && reminderDateTime < fiveMinutesFromNow) {
        await sendNotification(expense.userId, doc.id, expense);
      }
    });

    await Promise.all(promises);
    console.log("Reminder check complete.");
  });


async function sendNotification(userId: string, expenseId: string, expense: admin.firestore.DocumentData) {
  const userTokensSnapshot = await db.collection(`users/${userId}/fcmTokens`).get();
  
  if (userTokensSnapshot.empty) {
    console.log(`No FCM tokens for user ${userId}`);
    return;
  }

  const tokens = userTokensSnapshot.docs.map((doc) => doc.data().token);

  const message = {
    notification: {
      title: `Payment Reminder: ${expense.title}`,
      body: `Your payment of $${expense.amount.toFixed(2)} is due today.`,
    },
    webpush: {
      fcmOptions: {
        link: `/?expenseId=${expenseId}`,
      },
      notification: {
        icon: "/icons/icon-192x192.png",
        actions: [
          { action: "snooze", title: "Snooze (1 Hour)" },
          { action: "mark-as-paid", title: "Mark as Paid" },
        ],
      }
    },
    data: {
      expenseId: expenseId,
      link: `/?expenseId=${expenseId}`,
    },
    tokens: tokens,
  };

  try {
    const response = await admin.messaging().sendEachForMulticast(message);
    console.log(`Successfully sent message to ${response.successCount} devices.`);
    if (response.failureCount > 0) {
        const failedTokens: string[] = [];
        response.responses.forEach((resp, idx) => {
            if (!resp.success) {
                failedTokens.push(tokens[idx]);
            }
        });
        console.log('List of tokens that caused failures: ' + failedTokens);
        // Here you might want to clean up invalid tokens from your database
    }
  } catch (error) {
    console.error("Error sending message:", error);
  }
}
