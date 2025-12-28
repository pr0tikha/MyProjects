'use server';

/**
 * @fileOverview Determines the optimal reminder time based on user's wake-up schedule and payment patterns.
 *
 * - determineReminderTime - A function that determines the dynamic reminder time.
 * - DetermineReminderTimeInput - The input type for the determineReminderTime function.
 * - DetermineReminderTimeOutput - The return type for the determineReminderTime function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const DetermineReminderTimeInputSchema = z.object({
  userWakeUpTime: z
    .string()
    .describe("The user's typical wake-up time (e.g., '7:00 AM')."),
  paymentType: z
    .string()
    .describe("The type of payment (e.g., 'rent', 'bill', 'policy')."),
  paymentDueDate: z
    .string()
    .describe("The payment due date (e.g., '2024-12-25')."),
});
export type DetermineReminderTimeInput = z.infer<typeof DetermineReminderTimeInputSchema>;

const DetermineReminderTimeOutputSchema = z.object({
  reminderTime: z
    .string()
    .describe("The optimal reminder time (e.g., '6:00 PM')."),
  reasoning: z
    .string()
    .describe('Explanation of why the reminder time was chosen.'),
});
export type DetermineReminderTimeOutput = z.infer<typeof DetermineReminderTimeOutputSchema>;

export async function determineReminderTime(input: DetermineReminderTimeInput): Promise<DetermineReminderTimeOutput> {
  return determineReminderTimeFlow(input);
}

const prompt = ai.definePrompt({
  name: 'determineReminderTimePrompt',
  input: {schema: DetermineReminderTimeInputSchema},
  output: {schema: DetermineReminderTimeOutputSchema},
  prompt: `You are an AI assistant that helps determine the best time to set a payment reminder for a user.

  Consider the user's typical wake-up time, the type of payment, and the payment due date.

  Wake-up time: {{{userWakeUpTime}}}
  Payment type: {{{paymentType}}}
  Payment due date: {{{paymentDueDate}}}

  Reasoning:
  1. If the payment is urgent (e.g., due within 24 hours), set the reminder for immediately.
  2. For rent, set the reminder for the morning of the due date.
  3. For bills, set the reminder for 2 days before the due date in the evening.
  4. For policies, set the reminder for 7 days before the due date in the afternoon.
  5. Make sure the reminder is set during the day - avoid setting reminders late at night.

  Return the reminder time and explain your reasoning.

  Example:
  {
    "reminderTime": "8:00 AM",
    "reasoning": "The reminder is set for 8:00 AM on the due date to allow ample time to make the rent payment.",
  }
  `,
});

const determineReminderTimeFlow = ai.defineFlow(
  {
    name: 'determineReminderTimeFlow',
    inputSchema: DetermineReminderTimeInputSchema,
    outputSchema: DetermineReminderTimeOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
