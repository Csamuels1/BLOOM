// Copy for the staff web moderation queue (issue #41). Staff-facing, but the
// voice stays calm and factual: moderators read distressing reports, and plain,
// non-sensational language keeps the work sustainable. No shame language toward
// members whose content is under review. Covered by tests/copy.test.ts.
export const moderationCopy = {
  // Shell.
  title: 'Moderation queue',
  intro:
    'Reports and pending content waiting for review. Every action is recorded with your name and time.',

  // Web-only / access notices.
  webOnlyTitle: 'Open this on the web dashboard',
  webOnlyBody:
    'Moderation tools run on the web only. Sign in to the staff dashboard in a browser to review reports.',
  accessTitle: 'You do not have access to this',
  accessBody:
    'This area is for the moderation team. If you think you should have access, reach out to an admin.',

  // Tabs / sections.
  tabReports: 'Reports',
  tabMedia: 'Pending media',
  tabHistory: 'Recent actions',

  // Report card.
  reportReasonPrefix: 'Reported for',
  reasonSpam: 'spam or advertising',
  reasonHarassment: 'harassment or unkindness',
  reasonUnsafe: 'unsafe or harmful advice',
  reasonOther: 'something else',
  reportDetailsLabel: 'Reporter note',
  reportCountLabel: 'reports on this post',
  postStatusLabel: 'Post status',
  reportedOn: 'Reported',

  // Post / media statuses (plain language).
  statusPending: 'Pending review',
  statusApproved: 'Visible',
  statusRemoved: 'Removed',
  statusRejected: 'Rejected',
  reportOpen: 'Open',
  reportReviewing: 'In review',
  reportResolved: 'Resolved',
  reportDismissed: 'Dismissed',

  // Actions.
  startReview: 'Start review',
  approvePost: 'Keep post',
  removePost: 'Remove post',
  approveMedia: 'Approve image',
  rejectMedia: 'Reject image',
  resolveReport: 'Resolve',
  dismissReport: 'Dismiss',
  reasonFieldLabel: 'Note for the record (optional)',
  reasonFieldHint: 'Up to 1000 characters. Saved to the moderation history.',
  confirmGeneric: 'Confirm',
  cancel: 'Cancel',

  // Confirm prompts.
  confirmRemovePost: 'Remove this post? The author is told it was removed.',
  confirmRejectMedia: 'Reject this image? It will not be shown to anyone.',

  // History.
  historyIntro: 'The most recent moderation actions across the team.',
  actionApprove: 'kept',
  actionRemove: 'removed',
  actionStartReview: 'started review of',
  actionResolveReport: 'resolved a report on',
  actionDismissReport: 'dismissed a report on',
  targetPost: 'a post',
  targetMedia: 'an image',
  targetReport: 'a report',
  actedAt: 'at',

  // Empty / loading / error.
  reportsEmptyTitle: 'Nothing waiting',
  reportsEmptyBody: 'There are no open reports right now.',
  mediaEmptyTitle: 'No pending images',
  mediaEmptyBody: 'Images people attach will appear here before they go live.',
  historyEmptyTitle: 'No actions yet',
  historyEmptyBody: 'Moderation actions will show here as the team works.',
  loading: 'Loading…',
  loadErrorTitle: 'We could not load the queue',
  loadErrorBody: 'Nothing has changed. You can try loading it again.',
  actionErrorTitle: 'That action did not go through',
  actionErrorBody: 'Nothing was changed. Please try again.',
  notAuthorizedError:
    'The server declined that action for this account. Nothing was changed.',
  retry: 'Try again',

  // Members are referred to neutrally; identities beyond ids are not shown here.
  memberFallback: 'A member',
} as const;

export default moderationCopy;
