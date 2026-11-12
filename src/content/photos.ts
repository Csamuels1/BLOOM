// Voice-sensitive copy for private photos (issue #27). Covered by the
// prohibited-language test (tests/copy.test.ts once the supervisor wires it in).
//
// Voice rules (docs/BRAND_AND_COPY.md, AGENTS.md): BLOOM serves postpartum women
// first. These photos are the user's own private keepsakes — kept for themselves,
// never shared, never required. This feature deliberately avoids ALL comparison
// framing: no "before/after", no "progress pic" comparison, no "transformation",
// no side-by-side. We frame photos as personal, optional, and gentle. Amber is
// never used here (no safety notice involved).
export const photosCopy = {
  // Header — a calm, personal space.
  title: 'Your private photos',
  intro:
    'A quiet, private space for photos you want to keep for yourself. Only you can see them, and only if you choose to add any.',

  // Empty state — an invitation, never a push. Selection is always optional.
  emptyTitle: 'Nothing here unless you want it to be',
  emptyBody:
    'If you ever feel like keeping a photo for yourself, you can add one here. There is no need to, and nothing is expected.',
  emptyAction: 'Add one',

  // Add / pick.
  addLabel: 'Add a photo',
  addHint: 'Opens your photo library so you can choose an image to keep here.',
  adding: 'Adding your photo…',
  addError: 'We could not add that photo. You can try again whenever you like.',

  // Display / grid.
  listLabel: 'Your private photos',
  photoAlt: 'A private photo you saved',
  loadingLabel: 'Loading your photos…',
  loadError: 'We could not load your photos just now.',
  retry: 'Try again',
  dismiss: 'Okay',

  // Replace.
  replaceLabel: 'Replace',
  replaceHint: 'Choose a different image to keep in place of this one.',
  replacing: 'Replacing your photo…',
  replaceError: 'We could not replace that photo. Your photo is unchanged.',

  // Delete — gentle, reversible-feeling confirm. No alarm, no amber.
  deleteLabel: 'Remove',
  deleteHint: 'Removes this photo from your private space for good.',
  deleteConfirmTitle: 'Remove this photo?',
  deleteConfirmBody:
    'This takes the photo out of your private space. You can always add another later.',
  deleteConfirm: 'Remove',
  deleteCancel: 'Keep it',
  deleting: 'Removing your photo…',
  deleteError: 'We could not remove that photo. It is still here.',

  // A quiet reassurance about privacy.
  privacyNote: 'These photos stay private to you and are never shared.',
} as const;

export default photosCopy;
