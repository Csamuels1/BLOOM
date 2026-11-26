import { todayCopy, todayDailyNotes } from '@/content/today';

/**
 * Time-of-day greeting and daily gentle note for Today (issue #151).
 *
 * Both are pure functions of a `Date` read from the device clock — no location,
 * no network, no stored state — so they are deterministic and easy to test.
 */

export type TimeOfDay = 'morning' | 'afternoon' | 'evening';

/** Local hour (inclusive) at which each part of the day begins. */
export const MORNING_STARTS_AT = 5;
export const AFTERNOON_STARTS_AT = 12;
export const EVENING_STARTS_AT = 17;

/**
 * Part of the day for a local time: morning 05:00–11:59, afternoon 12:00–16:59,
 * evening 17:00–04:59 (the small hours stay "evening" so a night feed is met
 * softly rather than with an early "good morning").
 */
export function timeOfDayFor(date: Date): TimeOfDay {
  const hour = date.getHours();
  if (hour >= MORNING_STARTS_AT && hour < AFTERNOON_STARTS_AT) return 'morning';
  if (hour >= AFTERNOON_STARTS_AT && hour < EVENING_STARTS_AT) {
    return 'afternoon';
  }
  return 'evening';
}

const GREETINGS: Record<TimeOfDay, string> = {
  morning: todayCopy.greetingMorning,
  afternoon: todayCopy.greetingAfternoon,
  evening: todayCopy.greetingEvening,
};

/** The greeting for a local time, e.g. "Good afternoon". */
export function greetingFor(date: Date): string {
  return GREETINGS[timeOfDayFor(date)];
}

const MS_PER_DAY = 86_400_000;

/**
 * A whole-day number for the local calendar date (days since 1970-01-01). Built
 * from the local year/month/day via Date.UTC, so it is unaffected by the time
 * of day or daylight-saving shifts and changes exactly at local midnight.
 */
export function calendarDayNumber(date: Date): number {
  return Math.floor(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / MS_PER_DAY,
  );
}

/**
 * The gentle note for a local calendar date. Stable for the whole day, steps to
 * the next note each day, and wraps around the set. Returns `undefined` only if
 * the set is empty, so callers can simply omit the note.
 */
export function dailyNoteFor(
  date: Date,
  notes: readonly string[] = todayDailyNotes,
): string | undefined {
  if (notes.length === 0) return undefined;
  const day = calendarDayNumber(date);
  // Safe modulo for any day number (including dates before 1970).
  const index = ((day % notes.length) + notes.length) % notes.length;
  return notes[index];
}
