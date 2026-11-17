// Reminder preferences model (issue #36). Pure data + pure helpers only — no
// expo-notifications, no I/O, no React. Persisted by notificationStore.ts.
//
// PRIVACY: preferences describe WHEN a reminder arrives, never WHAT it says.
// Nothing here is a health detail; the delivered text lives in notificationsCopy
// and is lock-screen-safe.

/** A time of day for a reminder, in 24-hour local time. */
export interface TimeOfDay {
  hour: number;
  minute: number;
}

/**
 * A weekday, matching expo-notifications' WEEKLY trigger convention where
 * 1 = Sunday … 7 = Saturday.
 */
export type Weekday = 1 | 2 | 3 | 4 | 5 | 6 | 7;

/** All weekdays, Sunday-first (display order). */
export const ALL_WEEKDAYS: readonly Weekday[] = [1, 2, 3, 4, 5, 6, 7] as const;

/** Named time-of-day presets, so the schedule stays simple and non-sensitive. */
export type TimePreset = 'morning' | 'midday' | 'evening';

export const TIME_PRESETS: Record<TimePreset, TimeOfDay> = {
  morning: { hour: 9, minute: 0 },
  midday: { hour: 12, minute: 30 },
  evening: { hour: 19, minute: 0 },
};

export interface NotificationPrefs {
  /** Whether reminders are active. Default off — never a cold opt-in. */
  enabled: boolean;
  /** Local time of day the reminder should arrive. */
  time: TimeOfDay;
  /** Days a reminder arrives (1 = Sunday … 7 = Saturday). */
  weekdays: Weekday[];
}

/** Safe, non-sensitive defaults. Reminders start OFF and permission is unasked. */
export const DEFAULT_PREFS: NotificationPrefs = {
  enabled: false,
  time: { ...TIME_PRESETS.morning },
  weekdays: [...ALL_WEEKDAYS],
};

function isWeekday(value: number): value is Weekday {
  return Number.isInteger(value) && value >= 1 && value <= 7;
}

/** PURE. De-duplicate, sort, and clamp a weekday list to valid values. */
export function normalizeWeekdays(weekdays: readonly number[]): Weekday[] {
  const unique = new Set<Weekday>();
  for (const day of weekdays) {
    if (isWeekday(day)) unique.add(day);
  }
  return [...unique].sort((a, b) => a - b);
}

/** PURE. Clamp an arbitrary time into a valid 24-hour time. */
export function clampTime(time: TimeOfDay): TimeOfDay {
  const hour = Math.min(23, Math.max(0, Math.trunc(time.hour)));
  const minute = Math.min(59, Math.max(0, Math.trunc(time.minute)));
  return { hour, minute };
}

/** PURE. Which named preset (if any) a time exactly matches. */
export function presetForTime(time: TimeOfDay): TimePreset | null {
  for (const [name, preset] of Object.entries(TIME_PRESETS) as [
    TimePreset,
    TimeOfDay,
  ][]) {
    if (preset.hour === time.hour && preset.minute === time.minute) {
      return name;
    }
  }
  return null;
}

/** PURE. Friendly, deterministic 12-hour label (e.g. "9:00 AM"). No locale/I-O. */
export function formatTime(time: TimeOfDay): string {
  const { hour, minute } = clampTime(time);
  const period = hour < 12 ? 'AM' : 'PM';
  const base = hour % 12;
  const displayHour = base === 0 ? 12 : base;
  const paddedMinute = minute.toString().padStart(2, '0');
  return `${displayHour}:${paddedMinute} ${period}`;
}
