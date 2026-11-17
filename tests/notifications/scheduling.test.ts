import * as Notifications from 'expo-notifications';

import { notificationsCopy } from '@/content/notifications';
import {
  buildReminderContent,
  buildScheduleRequests,
  buildTriggers,
  applySchedule,
  cancelAllReminders,
} from '@/features/notifications/scheduling';
import {
  DEFAULT_PREFS,
  TIME_PRESETS,
  type NotificationPrefs,
} from '@/features/notifications/notificationPrefs';

// expo-notifications has no native module under Jest. Provide just the enum and
// the two scheduling calls used by scheduling.ts.
jest.mock('expo-notifications', () => ({
  SchedulableTriggerInputTypes: { DAILY: 'daily', WEEKLY: 'weekly' },
  cancelAllScheduledNotificationsAsync: jest.fn(async () => undefined),
  scheduleNotificationAsync: jest.fn(async () => 'scheduled-id'),
}));

const cancelAll =
  Notifications.cancelAllScheduledNotificationsAsync as jest.Mock;
const schedule = Notifications.scheduleNotificationAsync as jest.Mock;

/** Health details that must NEVER appear in lock-screen text. */
const PROHIBITED = ['weight', 'calorie', 'cycle', 'kg', 'lb'];

function assertNonSensitive(text: string): void {
  const lower = text.toLowerCase();
  // No numbers whatsoever (weights, calories, counts, dates).
  expect(lower).not.toMatch(/\d/);
  for (const term of PROHIBITED) {
    expect(lower).not.toContain(term);
  }
}

function prefs(partial: Partial<NotificationPrefs>): NotificationPrefs {
  return { ...DEFAULT_PREFS, enabled: true, ...partial };
}

describe('notification content is non-sensitive', () => {
  it('builds generic title/body with no health data or numbers', () => {
    const content = buildReminderContent();
    assertNonSensitive(content.title);
    assertNonSensitive(content.body);
    expect(content.title).toBe(notificationsCopy.reminderTitle);
    expect(content.body).toBe(notificationsCopy.reminderBody);
  });

  it('keeps every scheduled request lock-screen-safe regardless of preferences', () => {
    const requests = buildScheduleRequests(
      prefs({ weekdays: [2, 4, 6], time: { hour: 7, minute: 15 } }),
    );
    expect(requests.length).toBeGreaterThan(0);
    for (const request of requests) {
      assertNonSensitive(request.content.title ?? '');
      assertNonSensitive(request.content.body ?? '');
    }
  });
});

describe('buildTriggers reflects preferences', () => {
  it('yields nothing when disabled', () => {
    expect(buildTriggers(prefs({ enabled: false }))).toEqual([]);
  });

  it('yields nothing when no weekdays are selected', () => {
    expect(buildTriggers(prefs({ weekdays: [] }))).toEqual([]);
  });

  it('collapses all seven days into a single DAILY trigger', () => {
    const triggers = buildTriggers(
      prefs({ weekdays: [1, 2, 3, 4, 5, 6, 7], time: TIME_PRESETS.evening }),
    );
    expect(triggers).toHaveLength(1);
    expect(triggers[0]).toEqual({
      type: 'daily',
      hour: TIME_PRESETS.evening.hour,
      minute: TIME_PRESETS.evening.minute,
    });
  });

  it('builds one WEEKLY trigger per selected day with the chosen time', () => {
    const triggers = buildTriggers(
      prefs({ weekdays: [2, 4], time: { hour: 8, minute: 30 } }),
    );
    expect(triggers).toHaveLength(2);
    expect(triggers).toEqual([
      { type: 'weekly', weekday: 2, hour: 8, minute: 30 },
      { type: 'weekly', weekday: 4, hour: 8, minute: 30 },
    ]);
  });
});

describe('applySchedule / cancelAllReminders', () => {
  it('cancels existing reminders then schedules one request per trigger', async () => {
    await applySchedule(prefs({ weekdays: [2, 4] }));
    expect(cancelAll).toHaveBeenCalledTimes(1);
    expect(schedule).toHaveBeenCalledTimes(2);
  });

  it('cancels but schedules nothing when reminders are disabled', async () => {
    await applySchedule(prefs({ enabled: false }));
    expect(cancelAll).toHaveBeenCalledTimes(1);
    expect(schedule).not.toHaveBeenCalled();
  });

  it('cancelAllReminders clears the schedule', async () => {
    await cancelAllReminders();
    expect(cancelAll).toHaveBeenCalledTimes(1);
  });

  it('never rejects even when the native call throws', async () => {
    cancelAll.mockRejectedValueOnce(new Error('native failure'));
    await expect(
      applySchedule(prefs({ weekdays: [2] })),
    ).resolves.toBeUndefined();
  });
});
