import * as Notifications from 'expo-notifications';

import { notificationsCopy } from '@/content/notifications';

import {
  normalizeWeekdays,
  clampTime,
  type NotificationPrefs,
} from './notificationPrefs';

/**
 * Builds notification schedule requests and content (issue #36).
 *
 * The content-building functions are PURE and tested: they guarantee the text
 * delivered to a device's lock screen contains NO health details — it comes only
 * from notificationsCopy's generic reminder strings, never from preferences,
 * profile, weight, meals, or any number.
 */

export interface ReminderContent {
  title: string;
  body: string;
}

/**
 * PURE. The non-sensitive reminder content. Deliberately ignores all preference
 * and profile data: the lock screen only ever shows a gentle, generic hello.
 */
export function buildReminderContent(
  copy: Pick<
    typeof notificationsCopy,
    'reminderTitle' | 'reminderBody'
  > = notificationsCopy,
): ReminderContent {
  return { title: copy.reminderTitle, body: copy.reminderBody };
}

/**
 * PURE. The expo-notifications trigger inputs implied by the preferences. When
 * every weekday is selected a single DAILY trigger is used; otherwise one WEEKLY
 * trigger per selected day. An empty/disabled schedule yields no triggers.
 */
export function buildTriggers(
  prefs: NotificationPrefs,
): Notifications.NotificationTriggerInput[] {
  if (!prefs.enabled) return [];

  const { hour, minute } = clampTime(prefs.time);
  const weekdays = normalizeWeekdays(prefs.weekdays);
  if (weekdays.length === 0) return [];

  if (weekdays.length === 7) {
    return [
      {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
      },
    ];
  }

  return weekdays.map((weekday) => ({
    type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
    weekday,
    hour,
    minute,
  }));
}

/**
 * PURE. Full schedule requests (non-sensitive content + trigger) for the given
 * preferences. This is what gets handed to expo-notifications.
 */
export function buildScheduleRequests(
  prefs: NotificationPrefs,
  copy: Pick<
    typeof notificationsCopy,
    'reminderTitle' | 'reminderBody'
  > = notificationsCopy,
): Notifications.NotificationRequestInput[] {
  const content = buildReminderContent(copy);
  return buildTriggers(prefs).map((trigger) => ({
    content: { ...content },
    trigger,
  }));
}

/**
 * Cancel every scheduled reminder. Best-effort and crash-safe — disabling must
 * always feel immediate even if the native call rejects.
 */
export async function cancelAllReminders(): Promise<void> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch {
    // Nothing to surface: there is simply nothing scheduled afterwards.
  }
}

/**
 * Apply the preferences to the OS schedule: clear what exists, then (re)schedule
 * from the current preferences. Best-effort and crash-safe. Disabled or empty
 * preferences leave nothing scheduled.
 */
export async function applySchedule(
  prefs: NotificationPrefs,
  copy: Pick<
    typeof notificationsCopy,
    'reminderTitle' | 'reminderBody'
  > = notificationsCopy,
): Promise<void> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    if (!prefs.enabled) return;
    for (const request of buildScheduleRequests(prefs, copy)) {
      await Notifications.scheduleNotificationAsync(request);
    }
  } catch {
    // Scheduling is best-effort; never crash the UI over a delivery failure.
  }
}
