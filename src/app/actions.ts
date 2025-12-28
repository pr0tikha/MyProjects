"use server";
import { determineReminderTime, type DetermineReminderTimeInput, type DetermineReminderTimeOutput } from '@/ai/flows/dynamic-reminder-timing';

export async function getSuggestedTime(input: DetermineReminderTimeInput): Promise<{ success: boolean; data?: DetermineReminderTimeOutput; error?: string }> {
  try {
    const result = await determineReminderTime(input);
    return { success: true, data: result };
  } catch (error) {
    console.error("Error in getSuggestedTime action:", error);
    return { success: false, error: "Failed to get a suggestion from AI." };
  }
}
