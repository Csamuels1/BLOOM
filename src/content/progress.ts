// Voice-sensitive copy for the progress view (issue #26). Covered by the
// prohibited-language test (tests/copy.test.ts).
//
// Voice (docs/BRAND_AND_COPY.md, AGENTS.md): trends over spikes, never a verdict.
// Direction is described neutrally — loss, gain, and maintenance are equal, and
// we never praise or scold a number. Milestones recognize showing up, never a
// streak to protect and never a weight reached.
import type { MilestoneId } from '@/features/progress/milestones';

export const progressCopy = {
  title: 'Your progress',
  intro:
    'A calm look at your weekly averages over time. We smooth out the day-to-day so a single day never stands in for the bigger picture.',
  seeProgress: 'See your progress',

  // Chart.
  chartTitle: 'Weekly average',
  chartNote: 'Each point is one week’s average — never a single day.',

  // In-words summary (mirrors the chart for assistive tech and everyone else).
  summaryTitle: 'In words',
  directionSteady: 'Your weekly average has held fairly steady.',
  directionDown: 'Your weekly average has gently eased down.',
  directionUp: 'Your weekly average has gently drifted up.',
  directionInsufficient:
    'Add a little more and your weekly trend will take shape here.',
  currentAverageLabel: 'Most recent weekly average',
  weeksLoggedLabel: 'Weeks logged',

  // Milestones — showing up, never streaks.
  milestonesTitle: 'Moments worth noting',
  milestoneFirstEntry: 'You logged your first entry.',
  milestoneWeeks2: 'You’ve checked in across two different weeks.',
  milestoneWeeks4: 'Four weeks of checking in with yourself.',
  milestoneWeeks8: 'Eight weeks of showing up, at your own pace.',
  milestoneWeeks12: 'Twelve weeks of gentle, steady attention.',

  // States.
  loadingLabel: 'Loading your progress…',
  emptyTitle: 'No progress to show yet',
  emptyBody:
    'Add a few weight entries and your weekly trend will appear here — calmly, in your own time.',
  emptyCta: 'Log a weight',
  errorTitle: 'We could not load your progress',
  errorBody: 'Your entries are safe. You can try again.',
  retry: 'Try again',
} as const;

/** The gentle label for a milestone id. */
export function milestoneLabel(id: MilestoneId): string {
  switch (id) {
    case 'first_entry':
      return progressCopy.milestoneFirstEntry;
    case 'weeks_2':
      return progressCopy.milestoneWeeks2;
    case 'weeks_4':
      return progressCopy.milestoneWeeks4;
    case 'weeks_8':
      return progressCopy.milestoneWeeks8;
    case 'weeks_12':
      return progressCopy.milestoneWeeks12;
  }
}
