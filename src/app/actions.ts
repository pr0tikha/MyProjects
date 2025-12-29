"use server";
import { determineReminderTime, type DetermineReminderTimeInput, type DetermineReminderTimeOutput } from '@/ai/flows/dynamic-reminder-timing';

export async function getSuggestedTime(input: DetermineReminderTimeInput): Promise<{ success: boolean; data?: DetermineReminderTimeOutput; error?: string }> {
  try {
    const result = await determineReminderTime(input);
    return { success: true, data: result };
  } catch (error) {
    console.error("Error in getSuggestedTime action:", error);
    // This is a free-tier app, so we should not expose AI errors.
    // Return a generic message.
    return { success: false, error: "AI suggestion is not available at the moment." };
  }
}
