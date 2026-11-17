// Member-side reporting, blocking and removed-content notice (issue #40).
// There is intentionally no export that changes report or post status — those
// transitions happen only through audited moderator RPCs (#41).
export {
  MAX_REPORT_DETAILS_LENGTH,
  REPORT_REASONS,
  REPORT_STATUSES,
  SELF_BLOCK_ERROR,
  blockMember,
  isReportReason,
  isReportStatus,
  listMyBlocks,
  listMyReports,
  reportPost,
  unblockMember,
  validateReport,
  type MyBlock,
  type MyReport,
  type ReportOutcome,
  type ReportPostInput,
  type ReportReason,
  type ReportStatus,
  type ReportingResult,
} from './reportingService';
export { isBlocked, useReportingStore } from './reportingStore';
export { ReportSheet, type ReportSheetProps } from './ReportSheet';
export {
  PostSafetyActions,
  type PostSafetyActionsProps,
} from './PostSafetyActions';
export {
  BlockedMembersScreen,
  type BlockedMembersScreenProps,
} from './BlockedMembersScreen';
export {
  MyReportsScreen,
  describeReportStatus,
  type MyReportsScreenProps,
} from './MyReportsScreen';
export {
  RemovedPostNotice,
  type RemovedPostNoticeProps,
} from './RemovedPostNotice';
