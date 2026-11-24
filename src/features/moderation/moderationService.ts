import type { Session } from '@supabase/supabase-js';

import type { AppSupabaseClient } from '@/lib/supabase';
import type { Database } from '@/types/database';

/**
 * Staff moderation queue data access (issue #41).
 *
 * All authorization is enforced by the server, never by this module:
 *   - RLS lets only moderators SELECT others' reports, non-approved posts,
 *     pending media rows, the moderation audit, and read any community image
 *     (community_images_read_staff).
 *   - Every state change goes through a SECURITY DEFINER RPC (moderate_post,
 *     moderate_media, review_report) that re-checks is_moderator() and writes an
 *     audit row in the same transaction. There is no client-side status write.
 *
 * The client holds only the public anon key plus the caller's own JWT; the
 * service-role key is never present in the app. {@link isModeratorSession} is a
 * cosmetic gate for showing the UI — a non-moderator who bypasses it still reads
 * nothing (RLS) and every action throws 'not authorized' (42501).
 */

type ReportRow = Database['public']['Tables']['post_reports']['Row'];
type PostRow = Database['public']['Tables']['community_posts']['Row'];
type MediaRow = Database['public']['Tables']['post_media']['Row'];
type ActionRow = Database['public']['Tables']['moderation_actions']['Row'];

const COMMUNITY_BUCKET = 'community-images';
/** Signed-URL lifetime for previewing pending images (seconds). */
const SIGNED_URL_TTL = 300;
/** How many audit entries the history view loads. */
const HISTORY_LIMIT = 50;

/** Postgres insufficient_privilege, raised by the RPCs for non-moderators. */
const NOT_AUTHORIZED = '42501';

/** Open report joined to the post it concerns, as the queue shows it. */
export interface QueueReport {
  id: string;
  postId: string;
  reason: string;
  details: string | null;
  status: string;
  createdAt: string;
  postBody: string;
  postStatus: string;
  postAuthorId: string;
}

/** A pending image awaiting review, with a short-lived preview URL. */
export interface PendingMediaItem {
  id: string;
  postId: string;
  authorId: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
  postBody: string;
  postStatus: string;
  /** Signed preview URL, or null if one could not be created. */
  previewUrl: string | null;
}

/** One entry in the moderation audit history. */
export interface HistoryItem {
  id: string;
  /** Null when the moderator has since deleted their account (#57). */
  moderatorId: string | null;
  action: string;
  targetType: string;
  targetId: string;
  reason: string | null;
  createdAt: string;
}

export type PostAction = 'approve' | 'remove';
export type MediaAction = 'approve' | 'remove';
export type ReportAction = 'start_review' | 'resolve_report' | 'dismiss_report';

/** Discriminated result; expected failures are returned, not thrown. */
export type ModerationResult<T> =
  { ok: true; value: T } | { ok: false; error: string; notAuthorized: boolean };

const GENERIC_LOAD_ERROR = 'We could not load the queue just now.';
const GENERIC_ACTION_ERROR = 'That action did not go through.';
const NOT_AUTHORIZED_ERROR =
  'The server declined that action for this account.';

/**
 * Whether the signed-in session carries a moderator/admin role in immutable
 * app_metadata — the same claim the server's is_moderator() trusts. Cosmetic
 * only: it decides whether to render the queue, not whether actions succeed.
 */
export function isModeratorSession(session: Session | null): boolean {
  const role = session?.user?.app_metadata?.role;
  return role === 'moderator' || role === 'admin';
}

function mapPostgrestError(error: { code?: string } | null): {
  error: string;
  notAuthorized: boolean;
} {
  if (error?.code === NOT_AUTHORIZED) {
    return { error: NOT_AUTHORIZED_ERROR, notAuthorized: true };
  }
  return { error: GENERIC_ACTION_ERROR, notAuthorized: false };
}

type ReportWithPost = Pick<
  ReportRow,
  'id' | 'post_id' | 'reason' | 'details' | 'status' | 'created_at'
> & {
  community_posts: Pick<PostRow, 'body' | 'status' | 'author_id'> | null;
};

/**
 * Open and in-review reports, newest first, each joined to its post. Resolved
 * and dismissed reports drop out of the working queue (they remain in history).
 */
export async function listOpenReports(
  client: AppSupabaseClient,
): Promise<ModerationResult<QueueReport[]>> {
  const { data, error } = await client
    .from('post_reports')
    .select(
      'id, post_id, reason, details, status, created_at, community_posts ( body, status, author_id )',
    )
    .in('status', ['open', 'reviewing'])
    .order('created_at', { ascending: true });

  if (error || !data) {
    return { ok: false, error: GENERIC_LOAD_ERROR, notAuthorized: false };
  }

  const value: QueueReport[] = (data as ReportWithPost[]).map((row) => ({
    id: row.id,
    postId: row.post_id,
    reason: row.reason,
    details: row.details,
    status: row.status,
    createdAt: row.created_at,
    postBody: row.community_posts?.body ?? '',
    postStatus: row.community_posts?.status ?? 'removed',
    postAuthorId: row.community_posts?.author_id ?? '',
  }));
  return { ok: true, value };
}

type MediaWithPost = Pick<
  MediaRow,
  | 'id'
  | 'post_id'
  | 'author_id'
  | 'mime_type'
  | 'size_bytes'
  | 'created_at'
  | 'storage_path'
> & {
  community_posts: Pick<PostRow, 'body' | 'status'> | null;
};

/**
 * Pending media awaiting review, oldest first, with a short-lived signed
 * preview URL. Moderators may read any community image server-side
 * (community_images_read_staff), so the preview works before approval.
 */
export async function listPendingMedia(
  client: AppSupabaseClient,
): Promise<ModerationResult<PendingMediaItem[]>> {
  const { data, error } = await client
    .from('post_media')
    .select(
      'id, post_id, author_id, mime_type, size_bytes, created_at, storage_path, community_posts ( body, status )',
    )
    .eq('status', 'pending')
    .order('created_at', { ascending: true });

  if (error || !data) {
    return { ok: false, error: GENERIC_LOAD_ERROR, notAuthorized: false };
  }

  const rows = data as MediaWithPost[];
  const value: PendingMediaItem[] = await Promise.all(
    rows.map(async (row) => {
      let previewUrl: string | null = null;
      const signed = await client.storage
        .from(COMMUNITY_BUCKET)
        .createSignedUrl(row.storage_path, SIGNED_URL_TTL);
      if (!signed.error && signed.data) {
        previewUrl = signed.data.signedUrl;
      }
      return {
        id: row.id,
        postId: row.post_id,
        authorId: row.author_id,
        mimeType: row.mime_type,
        sizeBytes: row.size_bytes,
        createdAt: row.created_at,
        postBody: row.community_posts?.body ?? '',
        postStatus: row.community_posts?.status ?? 'removed',
        previewUrl,
      };
    }),
  );
  return { ok: true, value };
}

/** The most recent moderation actions across the team, newest first. */
export async function listRecentActions(
  client: AppSupabaseClient,
): Promise<ModerationResult<HistoryItem[]>> {
  const { data, error } = await client
    .from('moderation_actions')
    .select(
      'id, moderator_id, action, target_type, target_id, reason, created_at',
    )
    .order('created_at', { ascending: false })
    .limit(HISTORY_LIMIT);

  if (error || !data) {
    return { ok: false, error: GENERIC_LOAD_ERROR, notAuthorized: false };
  }

  const value: HistoryItem[] = (data as ActionRow[]).map((row) => ({
    id: row.id,
    moderatorId: row.moderator_id,
    action: row.action,
    targetType: row.target_type,
    targetId: row.target_id,
    reason: row.reason,
    createdAt: row.created_at,
  }));
  return { ok: true, value };
}

function trimmedReason(reason?: string | null): string | undefined {
  const trimmed = reason?.trim();
  return trimmed ? trimmed : undefined;
}

/** Keep or remove a post (audited server-side). Returns the new post status. */
export async function moderatePost(
  client: AppSupabaseClient,
  postId: string,
  action: PostAction,
  reason?: string | null,
): Promise<ModerationResult<string>> {
  const { data, error } = await client.rpc('moderate_post', {
    p_post_id: postId,
    p_action: action,
    p_reason: trimmedReason(reason),
  });
  if (error) {
    return { ok: false, ...mapPostgrestError(error) };
  }
  return { ok: true, value: data as string };
}

/** Approve or reject a pending image (audited). Returns the new media status. */
export async function moderateMedia(
  client: AppSupabaseClient,
  mediaId: string,
  action: MediaAction,
  reason?: string | null,
): Promise<ModerationResult<string>> {
  const { data, error } = await client.rpc('moderate_media', {
    p_media_id: mediaId,
    p_action: action,
    p_reason: trimmedReason(reason),
  });
  if (error) {
    return { ok: false, ...mapPostgrestError(error) };
  }
  return { ok: true, value: data as string };
}

/** Advance a report's lifecycle (audited). Returns the new report status. */
export async function reviewReport(
  client: AppSupabaseClient,
  reportId: string,
  action: ReportAction,
  reason?: string | null,
): Promise<ModerationResult<string>> {
  const { data, error } = await client.rpc('review_report', {
    p_report_id: reportId,
    p_action: action,
    p_reason: trimmedReason(reason),
  });
  if (error) {
    return { ok: false, ...mapPostgrestError(error) };
  }
  return { ok: true, value: data as string };
}
