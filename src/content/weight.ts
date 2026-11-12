// Voice-sensitive copy for the weight log (issue #25). Covered by the
// prohibited-language test (tests/copy.test.ts once the supervisor wires it in).
//
// Voice rules (docs/BRAND_AND_COPY.md, AGENTS.md): weight is neutral data, never
// a verdict. No shame, punishment, fear, or body-transformation language; no
// "good/bad", no before/after, no goals to "crush". We never celebrate a
// direction or scold a number — loss, gain, and maintenance are equal. Errors
// are gentle and always retryable, and we never clear what someone has typed.
export const weightCopy = {
  // Screen header — calm and matter-of-fact.
  title: 'Weight log',
  intro:
    'A private place to note your weight when you want to. There is no schedule to keep and no number to reach.',

  // Add / edit form.
  formAddTitle: 'Add an entry',
  formEditTitle: 'Edit this entry',
  weightLabel: 'Weight',
  weightHintMetric: 'Entered in kilograms.',
  weightHintImperial: 'Entered in pounds.',
  dateLabel: 'Date',
  dateHint:
    'When this was measured (YYYY-MM-DD). You can add more than one a day.',
  noteLabel: 'Note (optional)',
  noteHint: 'Anything you would like to remember alongside this entry.',
  saveAdd: 'Save entry',
  saveEdit: 'Save changes',
  cancelEdit: 'Cancel',
  saving: 'Saving…',

  // Validation — gentle, specific, never blaming.
  weightRequired: 'Enter a weight to continue.',
  weightOutOfRange: 'That weight is outside the range we can record.',
  dateInvalid: 'Please use the date format YYYY-MM-DD.',

  // List.
  listTitle: 'Your entries',
  emptyTitle: 'No entries yet',
  emptyBody:
    'When you add an entry, it will appear here. You are always in control of what you record.',
  editAction: 'Edit',
  deleteAction: 'Remove',
  deleteConfirmTitle: 'Remove this entry?',
  deleteConfirmBody:
    'This takes the entry out of your log. You can add it again anytime.',
  deleteConfirm: 'Remove',
  deleteCancel: 'Keep it',

  // Errors — nothing is lost; retry is always offered.
  saveErrorTitle: 'That did not save',
  saveErrorBody:
    'Your entry is still here — nothing was lost. Please check your connection and try again.',
  loadErrorTitle: 'We could not load your entries',
  loadErrorBody: 'Your log is safe. You can try loading it again.',
  retry: 'Try again',

  // A11y / live-region announcements.
  loadingLabel: 'Loading your entries…',
  savedAnnouncement: 'Entry saved.',
  removedAnnouncement: 'Entry removed.',
} as const;

export default weightCopy;
