// Voice-sensitive copy for optional cycle logging (issue #34). Covered by the
// prohibited-language test (tests/copy.test.ts once the supervisor wires in
// cycleCopy).
//
// SAFETY / VOICE (AGENTS.md, docs/BRAND_AND_COPY.md): BLOOM never diagnoses and
// never predicts. Cycle insights are ESTIMATES with explicit uncertainty — a
// rough guide, not medical advice, and never a certainty or a forecast stated as
// fact. When the dates are sparse or irregular we say so honestly rather than
// inventing a phase. All copy stays calm: no alarm, no verdicts, every error
// gentle and retryable, and nothing a person has typed is ever discarded.
export const cycleCopy = {
  // Screen header.
  title: 'Cycle notes',
  intro:
    'An optional, private place to note the day a period starts. Logging is entirely up to you, and anything here is a rough guide — not medical advice.',

  // Add / edit a start date.
  formAddTitle: 'Add a start date',
  formEditTitle: 'Edit this date',
  dateLabel: 'Period start date',
  dateHint:
    'The day a period began (YYYY-MM-DD). You can add as many or as few as you like.',
  saveAdd: 'Save date',
  saveEdit: 'Save changes',
  cancelEdit: 'Cancel',
  saving: 'Saving…',

  // Validation — gentle, specific, never blaming.
  dateInvalid: 'Please use the date format YYYY-MM-DD.',

  // List.
  listTitle: 'Your dates',
  emptyTitle: 'No dates yet',
  emptyBody:
    'When you note a start date, it will appear here. You are always in control of what you record.',
  editAction: 'Edit',
  deleteAction: 'Remove',
  deleteConfirmBody:
    'This takes the date out of your notes. You can add it again anytime.',
  deleteConfirm: 'Remove',
  deleteCancel: 'Keep it',

  // Insight framing — always an estimate, always uncertain.
  insightTitle: 'A rough estimate',
  insightDisclaimer:
    'This is an estimate based only on the dates you have logged. It is a rough guide, not medical advice, and not a prediction.',

  // Not enough data to estimate anything — said honestly.
  insufficientTitle: 'Not enough to estimate yet',
  insufficientBody:
    'With one date or none, there is not enough to estimate a pattern. Add a couple more start dates whenever you like, and a rough guide can appear here.',

  // Confidence notes, surfaced alongside any estimate.
  confidenceLow:
    'These dates vary quite a bit, so this estimate is especially rough.',
  confidenceModerate:
    'These dates have been fairly steady, though this is still only an estimate.',

  // Average length, phrased as an approximation.
  averageLengthLabel: 'Estimated average length',
  averageLengthValue: (days: number) => `around ${days} days`,

  // Estimated phase labels + soft, non-diagnostic descriptions.
  phaseMenstrualLabel: 'Around the start of your cycle',
  phaseMenstrualBody: 'Your most recent logged start was in the last few days.',
  phaseFollicularLabel: 'Early in your estimated cycle',
  phaseFollicularBody:
    'This is roughly the stretch after a period and before the middle of a cycle.',
  phaseOvulatoryLabel: 'Around the middle of your estimated cycle',
  phaseOvulatoryBody:
    'This is an approximate midpoint, which can shift from cycle to cycle.',
  phaseLutealLabel: 'Later in your estimated cycle',
  phaseLutealBody:
    'This is roughly the stretch before the next start might be expected.',
  phaseUncertainLabel: 'Hard to estimate right now',
  phaseUncertainBody:
    'It has been a while since your last logged start, so there is not enough recent data for even a rough guess. Adding a new start date can help.',

  // Estimated day within the cycle, phrased approximately.
  cycleDayValue: (day: number) => `about day ${day} of your estimated cycle`,

  // Disable flow — history is handled explicitly, never silently dropped.
  trackingSectionTitle: 'Cycle tracking',
  trackingOnBody:
    'Cycle notes are on. You can turn them off at any time and decide what happens to the dates you have saved.',
  trackingOffBody:
    'Cycle notes are off. You can turn them back on whenever you like.',
  turnOffAction: 'Turn off cycle notes',
  turnOnAction: 'Turn on cycle notes',
  disablePromptTitle: 'Turn off cycle notes?',
  disablePromptBody:
    'Before turning this off, choose what to do with the dates you have saved. Nothing is removed unless you ask for it.',
  disableKeepHistory: 'Turn off and keep my dates',
  disableDeleteHistory: 'Turn off and delete my dates',
  disableCancel: 'Never mind',
  disableKeepNote:
    'Your dates are kept and will be here if you turn cycle notes back on.',

  // Errors — nothing is lost; retry is always offered.
  saveErrorTitle: 'That did not save',
  saveErrorBody:
    'Your date is still here — nothing was lost. Please check your connection and try again.',
  loadErrorTitle: 'We could not load your dates',
  loadErrorBody: 'Your notes are safe. You can try loading them again.',
  clearErrorTitle: 'We could not delete your dates',
  clearErrorBody:
    'Nothing was removed. Your dates are still here — please try again.',
  retry: 'Try again',

  // A11y / live-region announcements.
  loadingLabel: 'Loading your dates…',
} as const;

export default cycleCopy;
