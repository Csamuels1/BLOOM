/**
 * Gentle progress milestones (issue #26).
 *
 * Milestones celebrate showing up for yourself — never a number reached, never a
 * streak to protect. There is NO punishment for gaps: missing a day or a week
 * removes nothing and breaks nothing. We recognize the act of checking in, at a
 * calm cadence, and loss/gain/maintenance are treated as equal (we never
 * celebrate a direction of weight change).
 */

import { weekStartOf, type WeighReading } from './weeklyAverages';

export type MilestoneId =
  'first_entry' | 'weeks_2' | 'weeks_4' | 'weeks_8' | 'weeks_12';

export interface Milestone {
  id: MilestoneId;
  /** Number of distinct weeks required (1 for the first-entry milestone). */
  weeksRequired: number;
}

/** Ordered thresholds. Distinct-week counts, never consecutive — gaps are fine. */
const MILESTONES: readonly Milestone[] = [
  { id: 'first_entry', weeksRequired: 1 },
  { id: 'weeks_2', weeksRequired: 2 },
  { id: 'weeks_4', weeksRequired: 4 },
  { id: 'weeks_8', weeksRequired: 8 },
  { id: 'weeks_12', weeksRequired: 12 },
];

/** How many DISTINCT calendar weeks have at least one entry (gaps allowed). */
export function distinctWeeks(readings: WeighReading[]): number {
  const weeks = new Set(readings.map((r) => weekStartOf(r.measured_at)));
  return weeks.size;
}

/**
 * The milestones earned so far, in order. Based on the count of distinct weeks
 * with any entry — so a week skipped here and there never takes a milestone
 * away. Returns only achieved milestones.
 */
export function earnedMilestones(readings: WeighReading[]): Milestone[] {
  if (readings.length === 0) {
    return [];
  }
  const weeks = distinctWeeks(readings);
  return MILESTONES.filter((milestone) => weeks >= milestone.weeksRequired);
}
