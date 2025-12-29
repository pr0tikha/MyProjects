
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import {Timestamp} from "firebase-admin/firestore";

admin.initializeApp();
const db = admin.firestore();

// Scheduled function to check for due reminders every 5 minutes.
export const checkDueReminders = functions.pubsub
  .schedule("every 5 minutes")
  .onRun(async (context) => {
    const now = Timestamp.now();
    functions.logger.log("Checking for due reminders at:", now.toDate());

    try {
      // Get all users
      const usersSnapshot = await db.collection("users").get();

      for (const userDoc of usersSnapshot.docs) {
        const userId = userDoc.id;

        // Find reminders that are due
        const remindersQuery = db
          .collection(`users/${userId}/expenseLogs`)
          .where("status", "==", "Due");

        const remindersSnapshot = await remindersQuery.get();

        if (remindersSnapshot.empty) {
          continue; // No due reminders for this user
        }

        // Get user's FCM tokens
        const tokensSnapshot = await db
          .collection(`users/${userId}/fcmTokens`)
          .get();
        const tokens = tokensSnapshot.docs.map((doc) => doc.data().token);

        if (tokens.length === 0) {
          continue; // No devices to notify
        }

        // Process each due reminder
        for (const reminderDoc of remindersSnapshot.docs) {
          const reminder = reminderDoc.data();
          const reminderDueDate = (reminder.dueDate as Timestamp).toDate();
          const [hours, minutes] = reminder.reminderTime.split(":").map(Number);
          const reminderDateTime = new Date(reminderDueDate);
          reminderDateTime.setHours(hours, minutes, 0, 0);

          // Check if the reminder time is within the last 5 minutes
          const timeDiff = now.toMillis() - reminderDateTime.getTime();
          const fiveMinutesInMillis = 5 * 60 * 1000;

          if (timeDiff >= 0 && timeDiff < fiveMinutesInMillis) {
            functions.logger.log(`Sending notification for reminder: 
              ${reminder.title} to user ${userId}`);

            const payload: admin.messaging.MessagingPayload = {
              notification: {
                title: `Payment Reminder: ${reminder.title}`,
                body:
                `Your payment of $${reminder.amount.toFixed(2)} is due today.`,
                icon: "/icons/icon-192x192.png",
                click_action: "/", // Open the app on click
              },
              webpush: {
                fcmOptions: {
                  link: "/",
                },
                notification: {
                  // Make notification persistent
                  requireInteraction: "true",
                  // Add action buttons
                  actions: [
                    {action: "snooze", title: "Snooze (1 Hour)"},
                    {action: "mark-as-paid", title: "Mark as Paid"},
                  ],
                  // Pass data to the service worker
                  data: {
                    expenseId: reminderDoc.id,
                  },
                },
              },
            };
            // Send notification to all of the user's devices
            await admin.messaging().sendToDevice(tokens, payload);
          }
        }
      }
      functions.logger.log("Finished checking reminders.");
    } catch (error) {
      functions.logger.error("Error checking due reminders:", error);
    }
  });
