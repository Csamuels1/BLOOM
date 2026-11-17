import type { AppSupabaseClient } from '@/lib/supabase';
import type { Database } from '@/types/database';

/**
 * Member-side reporting and blocking (issue #40).
 *
 * Server rules (#119 + Phase 4) do the real enforcement: RLS lets a reporter see
 * only their own reports, hides reports from the reported author, forbids
 * members from changing report or post status, and hides blocked pairs' content
 * in both directions. Moderation transitions only happen through moderator RPCs
 * that write audit rows.
 *
 * Deliberately, this module has NO function that changes a report's status or a
 * post's moderation status — members cannot restore removed content.
 */

type ReportRow = Database['public']['Tables']['post_reports']['Row'];
type BlockRow = Database['public']['Tables']['user_blocks']['Row'];

/** Allowed report reasons (schema CHECK on post_reports.reason). */
export const REPORT_REASONS = [
  'spam',
  'harassment',
  'unsafe',
  'other',
] as const;
export type ReportReason = (typeof REPORT_REASONS)[number];

/** Report lifecycle (schema CHECK on post_reports.status). Read-only to members. */
export const REPORT_STATUSES = [
  'open',
  'reviewing',
  'resolved',
  'dismissed',
] as const;
export type ReportStatus = (typeof REPORT_STATUSES)[number];

/** details text CHECK (length <= 1000). */
export const MAX_REPORT_DETAILS_LENGTH = 1000;

/** Postgres unique_violation. */
const UNIQUE_VIOLATION = '23505';

/**
 * The caller's own report, as shown to them. The reporter id is intentionally
 * not selected: the caller already knows it is them, and no screen ever needs a
 * reporter identity.
 */
export type MyReport = Pick<
  ReportRow,
  'id' | 'post_id' | 'reason' | 'details' | 'status' | 'created_at'
>;

/** One of the caller's blocks. */
export type MyBlock = Pick<BlockRow, 'blocked_id' | 'created_at'>;

/** Discriminated result; never thrown for expected failures. */
export type ReportingResult<T> =
  { ok: true; value: T } | { ok: false; error: string };

export interface ReportPostInput {
  postId: string;
  reason: ReportReason;
  details?: string | null;
}

/** `reported` for a new report; `already_reported` when one already exists. */
export type ReportOutcome = 'reported' | 'already_reported';

const MY_REPORT_COLUMNS = 'id, post_id, reason, details, status, created_at';

const GENERIC_REPORT_ERROR = 'We could not send your report just now.';
const GENERIC_REPORTS_LOAD_ERROR = 'We could not load your reports just now.';
const GENERIC_BLOCK_ERROR = 'We could not block just now.';
const GENERIC_UNBLOCK_ERROR = 'We could not unblock just now.';
const GENERIC_BLOCKS_LOAD_ERROR =
  'We could not load your blocked list just now.';
export const SELF_BLOCK_ERROR = 'You cannot block yourself.';
const REASON_ERROR = 'Choose the option that fits best to continue.';
const DETAILS_ERROR =
  'That is a little long — please shorten it to 1000 characters.';

export function isReportReason(value: unknown): value is ReportReason {
  return (
    typeof value === 'string' &&
    (REPORT_REASONS as readonly string[]).includes(value)
  );
}

export function isReportStatus(value: unknown): value is ReportStatus {
  return (
    typeof value === 'string' &&
    (REPORT_STATUSES as readonly string[]).includes(value)
  );
}

/** Validate report input against the schema; returns a message or null. */
export function validateReport(input: ReportPostInput): string | null {
  if (!isReportReason(input.reason)) {
    return REASON_ERROR;
  }
  if (
    input.details != null &&
    input.details.length > MAX_REPORT_DETAILS_LENGTH
  ) {
    return DETAILS_ERROR;
  }
  return null;
}

async function currentUserId(
  client: AppSupabaseClient,
): Promise<string | null> {
  const {
    data: { user },
    error,
  } = await client.auth.getUser();
  if (error || !user) {
    return null;
  }
  return user.id;
}

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: unknown }).code === UNIQUE_VIOLATION
  );
}

/**
 * Report a post. reporter_id is always the signed-in user's id (RLS rejects any
 * other). A second report of the same post hits the (post_id, reporter_id)
 * unique constraint and resolves gently as `already_reported`.
 */
export async function reportPost(
  client: AppSupabaseClient,
  input: ReportPostInput,
): Promise<ReportingResult<ReportOutcome>> {
  const invalid = validateReport(input);
  if (invalid) {
    return { ok: false, error: invalid };
  }

  const userId = await currentUserId(client);
  if (!userId) {
    return { ok: false, error: GENERIC_REPORT_ERROR };
  }

  const trimmed = input.details?.trim();
  const { error } = await client.from('post_reports').insert({
    post_id: input.postId,
    reporter_id: userId,
    reason: input.reason,
    details: trimmed ? trimmed : null,
  });

  if (error) {
    if (isUniqueViolation(error)) {
      return { ok: true, value: 'already_reported' };
    }
    return { ok: false, error: GENERIC_REPORT_ERROR };
  }
  return { ok: true, value: 'reported' };
}

/**
 * The caller's own reports, newest first. Filtered to reporter_id = caller even
 * though RLS already scopes members, so a moderator's personal list never shows
 * other people's reports.
 */
export async function listMyReports(
  client: AppSupabaseClient,
): Promise<ReportingResult<MyReport[]>> {
  const userId = await currentUserId(client);
  if (!userId) {
    return { ok: false, error: GENERIC_REPORTS_LOAD_ERROR };
  }

  const { data, error } = await client
    .from('post_reports')
    .select(MY_REPORT_COLUMNS)
    .eq('reporter_id', userId)
    .order('created_at', { ascending: false });

  if (error || !data) {
    return { ok: false, error: GENERIC_REPORTS_LOAD_ERROR };
  }
  return { ok: true, value: data };
}

/**
 * Block a member. Self-blocks are refused here as well as by the schema. A
 * repeat block (already present) resolves as success.
 */
export async function blockMember(
  client: AppSupabaseClient,
  memberId: string,
): Promise<ReportingResult<MyBlock>> {
  const userId = await currentUserId(client);
  if (!userId) {
    return { ok: false, error: GENERIC_BLOCK_ERROR };
  }
  if (!memberId || memberId === userId) {
    return { ok: false, error: SELF_BLOCK_ERROR };
  }

  const { error } = await client
    .from('user_blocks')
    .insert({ blocker_id: userId, blocked_id: memberId });

  if (error && !isUniqueViolation(error)) {
    return { ok: false, error: GENERIC_BLOCK_ERROR };
  }
  return {
    ok: true,
    value: { blocked_id: memberId, created_at: new Date().toISOString() },
  };
}

/** Remove one of the caller's blocks (owner-scoped by RLS and by filter). */
export async function unblockMember(
  client: AppSupabaseClient,
  memberId: string,
): Promise<ReportingResult<string>> {
  const userId = await currentUserId(client);
  if (!userId) {
    return { ok: false, error: GENERIC_UNBLOCK_ERROR };
  }

  const { error } = await client
    .from('user_blocks')
    .delete()
    .eq('blocker_id', userId)
    .eq('blocked_id', memberId);

  if (error) {
    return { ok: false, error: GENERIC_UNBLOCK_ERROR };
  }
  return { ok: true, value: memberId };
}

/** The caller's blocks, newest first. */
export async function listMyBlocks(
  client: AppSupabaseClient,
): Promise<ReportingResult<MyBlock[]>> {
  const userId = await currentUserId(client);
  if (!userId) {
    return { ok: false, error: GENERIC_BLOCKS_LOAD_ERROR };
  }

  const { data, error } = await client
    .from('user_blocks')
    .select('blocked_id, created_at')
    .eq('blocker_id', userId)
    .order('created_at', { ascending: false });

  if (error || !data) {
    return { ok: false, error: GENERIC_BLOCKS_LOAD_ERROR };
  }
  return { ok: true, value: data };
}
