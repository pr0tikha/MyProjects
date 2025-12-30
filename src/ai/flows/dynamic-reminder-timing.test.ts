'use server';

import {
  assert,
  assertExists,
} from 'https://deno.land/std@0.224.0/assert/mod.ts';
import { determineReminderTime } from './dynamic-reminder-timing.ts';
import type { DetermineReminderTimeOutput } from './dynamic-reminder-timing.ts';

Deno.test('AI Reminder Timing Tests', async (t) => {
  await t.step(
    'should suggest a morning reminder for a rent payment due today',
    async () => {
      // GIVEN a rent payment due today
      const input = {
        userWakeUpTime: '7:00 AM',
        paymentType: 'Housing' as const,
        paymentDueDate: new Date().toISOString().split('T')[0], // Today's date
      };

      // WHEN the AI determines the reminder time
      const result: DetermineReminderTimeOutput = await determineReminderTime(input);

      // THEN it should return a valid time and a logical reason
      assertExists(result);
      assertExists(result.reminderTime, 'The AI should suggest a reminder time.');
      assert(
        result.reasoning.toLowerCase().includes('rent'),
        'The reasoning should mention rent or housing.'
      );

      // And the time should be in the morning, as per the prompt guidelines
      const [hour] = result.reminderTime.split(':').map(Number);
      assert(hour < 12, 'The reminder time for rent should be in the morning.');
    }
  );

  await t.step(
    'should suggest a reminder 7 days prior for an insurance payment',
    async () => {
        // GIVEN an insurance payment
        const input = {
            userWakeUpTime: '8:00 AM',
            paymentType: 'Insurance' as const,
            paymentDueDate: '2025-12-25',
        };

        // WHEN the AI determines the reminder time
        const result = await determineReminderTime(input);

        // THEN it should return a valid time and a logical reason mentioning the 7-day lead time
        assertExists(result);
        assertExists(result.reminderTime);
        assert(
            result.reasoning.toLowerCase().includes('7 days'),
            'The reasoning for insurance should mention a 7-day lead time.'
        );
    }
);
});
