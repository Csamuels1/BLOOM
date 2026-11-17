// Pure, deterministic cycle insight logic (issue #34).
//
// SAFETY / VOICE (AGENTS.md, docs/BRAND_AND_COPY.md): BLOOM never diagnoses and
// never predicts. Everything here is an ESTIMATE derived only from the start
// dates a person chose to log, and the result always carries its confidence
// explicitly so the UI can speak with honest uncertainty. When there is not
// enough data, or the data is irregular, we say so rather than inventing a
// phase. There is no randomness and no reading of the clock: "today" is passed
// in, so the same inputs always produce the same output.

/** How much the estimate can be trusted, stated explicitly — never certainty. */
export type CycleConfidence = 'insufficient' | 'low' | 'moderate';

/**
 * A rough, estimated position within the cycle. `uncertain` is returned
 * whenever the dates do not support even a rough guess (e.g. the last logged
 * start is long past the estimated length), instead of guessing anyway.
 */
export type CyclePhase =
  'menstrual' | 'follicular' | 'ovulatory' | 'luteal' | 'uncertain';

/** Returned when there are fewer than two starts: no phase is guessed. */
export interface InsufficientDataInsight {
  kind: 'insufficient-data';
  confidence: 'insufficient';
  /** How many usable start dates were provided. */
  startCount: number;
}

/** An estimate built from two or more starts, always carrying its confidence. */
export interface EstimateInsight {
  kind: 'estimate';
  /** 'low' for a single interval or irregular data; 'moderate' when steady. */
  confidence: 'low' | 'moderate';
  startCount: number;
  /** Rounded mean interval between starts, in days. */
  averageCycleLength: number;
  /** Whole days from the most recent logged start to `today`. */
  daysSinceLastStart: number;
  /** A rough estimated phase, or 'uncertain' when a guess is not supportable. */
  estimatedPhase: CyclePhase;
  /** 1-based estimated day within the current cycle, or null when uncertain. */
  estimatedCycleDay: number | null;
  /** True when the last start is well past the estimated length (data may be stale). */
  overdue: boolean;
}

export type CycleInsight = InsufficientDataInsight | EstimateInsight;

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const MS_PER_DAY = 86_400_000;

/** The first 5 days (index 0..4) are treated as the menstrual window. */
const MENSTRUAL_WINDOW_DAYS = 5;
/** Luteal phase is roughly fixed (~14 days), so ovulation ≈ length − 14. */
const LUTEAL_LENGTH = 14;
/** Coefficient of variation at or below this reads as steady → moderate. */
const STEADY_CV_THRESHOLD = 0.15;

/**
 * Parse a YYYY-MM-DD string to a UTC day index (days since the epoch), or null
 * when it is not a real calendar date. Using UTC keeps the math free of any
 * timezone or DST shift, which is what makes the function deterministic.
 */
function toDayIndex(value: string): number | null {
  if (!DATE_PATTERN.test(value)) {
    return null;
  }
  const [yearStr, monthStr, dayStr] = value.split('-');
  if (yearStr === undefined || monthStr === undefined || dayStr === undefined) {
    return null;
  }
  const year = Number(yearStr);
  const month = Number(monthStr);
  const day = Number(dayStr);
  const utc = Date.UTC(year, month - 1, day);
  const date = new Date(utc);
  // Reject rolled-over dates like 2026-02-31.
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }
  return Math.round(utc / MS_PER_DAY);
}

/** Unique, valid start-day indices in ascending order. */
function normalizeStarts(starts: readonly string[]): number[] {
  const seen = new Set<number>();
  for (const raw of starts) {
    const index = toDayIndex(raw);
    if (index !== null) {
      seen.add(index);
    }
  }
  return [...seen].sort((a, b) => a - b);
}

/** Population standard deviation of a non-empty list of intervals. */
function standardDeviation(values: readonly number[], mean: number): number {
  const variance =
    values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

/**
 * Estimate the current cycle picture from logged start dates.
 *
 * - Fewer than two usable starts → `insufficient-data` (no phase is invented).
 * - Exactly one interval → a `low`-confidence estimate (regularity is unknown).
 * - Two or more intervals → `moderate` only when they are steady; otherwise
 *   `low`, with the result saying the estimate is rough.
 *
 * The phase is always a rough estimate; when the most recent start is well past
 * the estimated length the phase is `uncertain` and no cycle day is claimed.
 */
export function estimateCycleInsight(
  starts: readonly string[],
  today: string,
): CycleInsight {
  const ordered = normalizeStarts(starts);
  const todayIndex = toDayIndex(today);

  if (ordered.length < 2 || todayIndex === null) {
    return {
      kind: 'insufficient-data',
      confidence: 'insufficient',
      startCount: ordered.length,
    };
  }

  const intervals: number[] = [];
  for (let i = 1; i < ordered.length; i += 1) {
    const prev = ordered[i - 1];
    const curr = ordered[i];
    if (prev !== undefined && curr !== undefined) {
      intervals.push(curr - prev);
    }
  }

  const mean =
    intervals.reduce((sum, value) => sum + value, 0) / intervals.length;
  const averageCycleLength = Math.round(mean);

  // Confidence: a single interval can't show regularity, so it stays low.
  // With more intervals, a low coefficient of variation reads as steady.
  let confidence: 'low' | 'moderate' = 'low';
  if (intervals.length >= 2) {
    const cv = mean > 0 ? standardDeviation(intervals, mean) / mean : 1;
    confidence = cv <= STEADY_CV_THRESHOLD ? 'moderate' : 'low';
  }

  const lastStart = ordered[ordered.length - 1] ?? todayIndex;
  const daysSinceLastStart = Math.max(0, todayIndex - lastStart);

  // Overdue when we are more than a cycle-length (plus a quarter-length grace,
  // at least 5 days) past the last start — the data is likely stale, so we
  // decline to guess a phase rather than assert one.
  const grace = Math.max(5, Math.round(averageCycleLength * 0.25));
  const overdue = daysSinceLastStart > averageCycleLength + grace;

  let estimatedPhase: CyclePhase;
  let estimatedCycleDay: number | null;
  if (overdue) {
    estimatedPhase = 'uncertain';
    estimatedCycleDay = null;
  } else {
    estimatedCycleDay = daysSinceLastStart + 1;
    const ovulationDay = Math.max(
      MENSTRUAL_WINDOW_DAYS,
      averageCycleLength - LUTEAL_LENGTH,
    );
    if (daysSinceLastStart < MENSTRUAL_WINDOW_DAYS) {
      estimatedPhase = 'menstrual';
    } else if (daysSinceLastStart < ovulationDay - 1) {
      estimatedPhase = 'follicular';
    } else if (daysSinceLastStart <= ovulationDay + 1) {
      estimatedPhase = 'ovulatory';
    } else {
      estimatedPhase = 'luteal';
    }
  }

  return {
    kind: 'estimate',
    confidence,
    startCount: ordered.length,
    averageCycleLength,
    daysSinceLastStart,
    estimatedPhase,
    estimatedCycleDay,
    overdue,
  };
}
