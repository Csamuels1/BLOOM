// Voice-sensitive copy for the community spaces (issue #38). Covered by the
// prohibited-language test (tests/copy.test.ts once the supervisor wires it in).
//
// Voice rules (docs/BRAND_AND_COPY.md, AGENTS.md): emotional safety over
// engagement. There are NO counts anywhere — no tallies of support, no
// followers, no streaks. Support is a quiet "I'm with you" signal, never a
// score. No shame, comparison, or body-transformation language. Posts are
// reviewed before they appear, and we say so warmly. Pro is an open door,
// never a locked gate or a guilt trip. Every string here is top level so the
// copy test sees all of it.
export const communityCopy = {
  // Screen header.
  title: 'Community',
  intro:
    'Two calm spaces to share and be heard. Every post is reviewed with care before it appears, and nothing here is ever scored or counted.',

  // Space chooser.
  chooserTitle: 'Choose a space',
  chooserIntro:
    'Each space keeps its own conversations, so you can be among people in a similar season. You can switch whenever you like.',
  chooserGroupLabel: 'Community spaces',
  spaceRecoveryTitle: 'Postpartum recovery',
  spaceRecoveryBody:
    'For healing, rest, feeding, sleep, and finding your feet again after birth.',
  spaceGentleLossTitle: 'Gentle weight care',
  spaceGentleLossBody:
    'For moving toward a weight that feels right for you, slowly and kindly, with no comparisons.',
  chooserPrompt:
    'Pick the space that feels right today to see what people are sharing.',

  // Feed states.
  feedTitle: 'Shared in this space',
  loadingLabel: 'Loading posts',
  emptyTitle: 'It is quiet here for now',
  emptyBody:
    'No posts have been shared in this space yet. When someone shares, it will appear here once it has been reviewed.',
  loadErrorTitle: 'We could not load this space',
  loadErrorBody:
    'Something interrupted loading. Nothing you shared is lost — try again when you are ready.',
  retry: 'Try again',

  // Post card.
  yourPost: 'Your post',
  awaitingReview: 'Awaiting review',
  awaitingReviewBody:
    'Only you can see this until it has been reviewed. Thank you for your patience.',
  deleteAction: 'Delete post',
  deleteConfirmBody:
    'Delete this post? It will be removed from the space. This cannot be undone.',
  deleteConfirm: 'Yes, delete it',
  deleteCancel: 'Keep it',
  supportAction: 'I am with you',
  supportActive: 'You are with them',
  supportHint:
    'A quiet signal of support. Only the person who shared sees that someone is with them — never how many.',
  supportReceived: 'Someone is with you.',

  // Composer.
  composerTitle: 'Share something',
  composerLabel: 'Your post',
  composerHint:
    'Share as much or as little as you like. Posts are reviewed before they appear.',
  composerSubmit: 'Share post',
  composerTooLong: 'That is a little long — please shorten it a bit.',
  composerEmpty: 'Write a few words to share.',
  composerPosted:
    'Thanks for sharing — it will appear once it has been reviewed.',
  composerErrorTitle: 'We could not share your post just now',
  composerErrorBody:
    'Your words are still here. Try again whenever you are ready.',

  // Gentle action errors (delete / support).
  actionErrorTitle: 'That did not go through',
  actionErrorBody:
    'Something interrupted that just now. Nothing has changed — you can try again.',
  dismiss: 'Okay',

  // Pro note (free tier reads; posting and support are part of Pro).
  proNoteTitle: 'Sharing is part of Pro',
  proNoteBody:
    'Reading every space is free and always will be. Posting and sending support are part of Pro, whenever you want them.',
} as const;

export type CommunityCopy = typeof communityCopy;
