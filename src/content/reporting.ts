// Voice-sensitive copy for member-side reporting, blocking and removed-content
// notices (issue #40). Covered by the prohibited-language test once the
// supervisor adds `reportingCopy` to tests/copy.test.ts.
//
// Voice rules (docs/BRAND_AND_COPY.md, AGENTS.md): reporting feels safe and
// quiet; we confirm privately and never reveal who reported anything. Blocking
// is immediate and calm. No shame or blame language toward anyone, and we never
// offer a way to restore content that was removed.
export const reportingCopy = {
  // Post safety actions (shown on posts by someone else only).
  reportAction: 'Report',
  reportActionLabel: 'Report this post',
  blockAction: 'Block',
  blockActionLabel: 'Block this member',

  // Report sheet.
  reportTitle: 'Report this post',
  reportIntro:
    'Reports are private. The person who shared this post will not know who reported it.',
  reasonGroupLabel: 'What is going on?',
  reasonSpam: 'Spam or advertising',
  reasonSpamHint: 'Unwanted promotion, links or repeated posts.',
  reasonHarassment: 'Harassment or unkindness',
  reasonHarassmentHint: 'Targeting, insulting or pressuring someone.',
  reasonUnsafe: 'Unsafe or harmful advice',
  reasonUnsafeHint: 'Something that could put someone’s health at risk.',
  reasonOther: 'Something else',
  reasonOtherHint: 'Anything else you would like us to look at.',
  detailsLabel: 'Anything else to add? (optional)',
  detailsHint: 'Up to 1000 characters. Only our team will see this.',
  detailsTooLong:
    'That is a little long — please shorten it to 1000 characters.',
  reasonRequired: 'Choose the option that fits best to continue.',
  submitReport: 'Send report',
  submittingReport: 'Sending…',
  cancelReport: 'Not now',
  reportSentTitle: 'Thanks — we’ll take a look',
  reportSentBody:
    'Thanks — we’ll take a look. The person won’t know you reported this.',
  alreadyReportedTitle: 'You have already reported this',
  alreadyReportedBody:
    'Your earlier report is with our team. The person won’t know you reported this.',
  reportDone: 'Done',
  reportErrorTitle: 'That did not send',
  reportErrorBody:
    'Nothing was lost. Please check your connection and try again.',

  // Block flow.
  blockConfirmTitle: 'Block this member?',
  blockConfirmBody:
    'You won’t see each other’s posts here. They won’t be told. You can unblock anytime from your settings.',
  blockConfirm: 'Block',
  blockCancel: 'Cancel',
  blockedDone: 'Blocked. You won’t see each other’s posts here.',
  blockErrorBody: 'We could not block just now. Please try again.',
  selfBlockError: 'You cannot block yourself.',

  // Blocked members screen.
  blockedTitle: 'Blocked members',
  blockedIntro:
    'People you have blocked. You won’t see each other’s posts here, and they are never told.',
  blockedEmptyTitle: 'No one is blocked',
  blockedEmptyBody:
    'If you block someone from a post, they will appear here so you can change your mind later.',
  blockedMemberFallback: 'A member',
  blockedSince: 'Blocked on',
  unblockAction: 'Unblock',
  unblockConfirmBody:
    'Unblock this member? You will be able to see each other’s posts again. They won’t be told.',
  unblockConfirm: 'Unblock',
  unblockCancel: 'Keep blocked',
  unblockErrorBody: 'We could not unblock just now. Please try again.',
  blocksLoadErrorTitle: 'We could not load this list',
  blocksLoadErrorBody: 'Nothing has changed. You can try loading it again.',

  // My reports screen.
  myReportsTitle: 'Your reports',
  myReportsIntro:
    'Reports you have sent and where they are. Only you can see this list.',
  myReportsEmptyTitle: 'No reports yet',
  myReportsEmptyBody:
    'If you report a post, you can check on it here. Reports are always private.',
  reportedOn: 'Sent on',
  reasonPrefix: 'Reason',
  statusOpen: 'Received — waiting for our team',
  statusReviewing: 'Our team is looking at this',
  statusResolved: 'Reviewed — action was taken',
  statusDismissed: 'Reviewed — no action needed',
  statusUnknown: 'Received',
  reportsLoadErrorTitle: 'We could not load your reports',
  reportsLoadErrorBody:
    'Your reports are safe. You can try loading them again.',

  // Removed post notice (shown to the author of a removed post).
  removedTitle: 'This post was removed',
  removedBody:
    'Our team removed this post because it did not fit the community guidelines. It is no longer visible to others.',
  removedFollowUp:
    'This is not a judgement of you. If you think we got it wrong, you can reach us through Help.',

  retry: 'Try again',
  loadingLabel: 'Loading…',
} as const;

export default reportingCopy;
