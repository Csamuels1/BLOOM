/**
 * Weekly-average progress math (issue #26).
 *
 * BLOOM shows trends, not daily spikes: a single day's weight moves for all
 * sorts of reasons, so the progress view is built on WEEKLY AVERAGES. These
 * functions are pure and timezone-free (they work on YYYY-MM-DD calendar dates),
 * so they are easy to test and never drift across time zones.
 */

/** The minimal entry shape this module needs. */
export interface WeighReading {
  /** Calendar date, YYYY-MM-DD. */
  measured_at: string;
  /** Canonical weight in kilograms. */
  weight_kg: number;
}

/** One week's average, keyed by the Monday that starts the week. */
export interface WeeklyPoint {
  /** Monday of the week, YYYY-MM-DD. */
  weekStart: string;
  /** Mean of that week's entries, in kilograms (rounded to 1 decimal). */
  averageKg: number;
  /** How many entries fed this average. */
  count: number;
}

function roundTo(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

/** Parse YYYY-MM-DD into a local-midnight Date built from its components. */
function parseDate(ymd: string): Date {
  const [year, month, day] = ymd.split('-').map((part) => Number(part));
  return new Date(year ?? 1970, (month ?? 1) - 1, day ?? 1);
}

function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** The Monday (YYYY-MM-DD) that starts the week containing the given date. */
export function weekStartOf(ymd: string): string {
  const date = parseDate(ymd);
  const dayOfWeek = date.getDay(); // 0=Sun .. 6=Sat
  const offsetToMonday = (dayOfWeek + 6) % 7;
  date.setDate(date.getDate() - offsetToMonday);
  return formatDate(date);
}

/**
 * Collapse readings into one average per calendar week, oldest first. Multiple
 * entries in a week are averaged (de-spiking); weeks with no entries are simply
 * absent (we never invent data).
 */
export function toWeeklyAverages(readings: WeighReading[]): WeeklyPoint[] {
  const buckets = new Map<string, { sum: number; count: number }>();
  for (const reading of readings) {
    const key = weekStartOf(reading.measured_at);
    const bucket = buckets.get(key) ?? { sum: 0, count: 0 };
    bucket.sum += reading.weight_kg;
    bucket.count += 1;
    buckets.set(key, bucket);
  }
  return [...buckets.entries()]
    .map(([weekStart, { sum, count }]) => ({
      weekStart,
      averageKg: roundTo(sum / count, 1),
      count,
    }))
    .sort((a, b) => (a.weekStart < b.weekStart ? -1 : 1));
}

/** A gentle, non-judgmental reading of the weekly trend. */
export interface TrendSummary {
  /** 'insufficient' until there are at least two weekly points. */
  direction: 'insufficient' | 'steady' | 'down' | 'up';
  weeks: number;
  firstKg: number | null;
  lastKg: number | null;
  /** Signed change in kg from first to last weekly average (last - first). */
  changeKg: number | null;
}

/**
 * Summarize the weekly series as a direction plus endpoints. "steady" when the
 * net change is within a small band, so ordinary fluctuation never reads as a
 * trend. Direction is descriptive only — loss, gain, and maintenance are equal.
 */
export function summarizeTrend(
  points: WeeklyPoint[],
  steadyBandKg = 0.5,
): TrendSummary {
  if (points.length < 2) {
    const only = points[0]?.averageKg ?? null;
    return {
      direction: 'insufficient',
      weeks: points.length,
      firstKg: only,
      lastKg: only,
      changeKg: null,
    };
  }
  const firstKg = points[0]!.averageKg;
  const lastKg = points[points.length - 1]!.averageKg;
  const changeKg = roundTo(lastKg - firstKg, 1);
  let direction: TrendSummary['direction'] = 'steady';
  if (changeKg <= -steadyBandKg) direction = 'down';
  else if (changeKg >= steadyBandKg) direction = 'up';
  return { direction, weeks: points.length, firstKg, lastKg, changeKg };
}
