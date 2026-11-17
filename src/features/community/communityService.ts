import type { AppSupabaseClient } from '@/lib/supabase';
import type { Database } from '@/types/database';

/** A community post row as returned by the server (RLS-filtered). */
export type CommunityPost =
  Database['public']['Tables']['community_posts']['Row'];

/** The two distinct spaces (schema CHECK: space in ('recovery','gentle_loss')). */
export type CommunitySpace = 'recovery' | 'gentle_loss';

export const COMMUNITY_SPACES: readonly CommunitySpace[] = [
  'recovery',
  'gentle_loss',
] as const;

/** Narrow an unknown value (e.g. read from storage) to a space. */
export function isCommunitySpace(value: unknown): value is CommunitySpace {
  return value === 'recovery' || value === 'gentle_loss';
}

/** Discriminated result so callers can branch without try/catch and never lose input. */
export type CommunityResult<T> =
  { ok: true; value: T } | { ok: false; error: string };

/**
 * Per-post booleans. Support is a yes/no signal by design — this map never
 * carries a count, so no screen can render one.
 */
export type SupportMap = Record<string, boolean>;

/** Schema bounds: body CHECK (char_length between 1 and 5000). */
export const MIN_POST_LENGTH = 1;
export const MAX_POST_LENGTH = 5000;

const SUPPORT_REACTION = 'support';
/** Postgres unique_violation: the support already exists, which is fine. */
const UNIQUE_VIOLATION = '23505';

const GENERIC_LOAD_ERROR = 'We could not load this space just now.';
const GENERIC_POST_ERROR = 'We could not share your post just now.';
const GENERIC_DELETE_ERROR = 'We could not remove your post just now.';
const GENERIC_SUPPORT_ERROR = 'We could not update your support just now.';
const GENERIC_PRO_ERROR = 'We could not check your plan just now.';

export interface CreatePostInput {
  space: CommunitySpace;
  body: string;
}

/** Validate a post body against the schema bounds; returns an error or null. */
export function validatePostBody(body: string): string | null {
  const trimmed = body.trim();
  if (trimmed.length < MIN_POST_LENGTH) {
    return 'Write a few words to share.';
  }
  if (trimmed.length > MAX_POST_LENGTH) {
    return 'That is a little long — please shorten it a bit.';
  }
  return null;
}

/** The signed-in caller's id, or null when there is no session. */
export async function getViewerId(
  client: AppSupabaseClient,
): Promise<string | null> {
  try {
    const {
      data: { user },
      error,
    } = await client.auth.getUser();
    if (error || !user) return null;
    return user.id;
  } catch {
    return null;
  }
}

/**
 * The feed for one space, newest first. RLS already returns only APPROVED
 * posts plus the caller's own pending/removed posts, and hides blocked pairs;
 * we additionally exclude removed posts so the caller sees approved posts and
 * their own posts that are awaiting review.
 */
export async function listPosts(
  client: AppSupabaseClient,
  space: CommunitySpace,
): Promise<CommunityResult<CommunityPost[]>> {
  const { data, error } = await client
    .from('community_posts')
    .select('*')
    .eq('space', space)
    .in('status', ['approved', 'pending'])
    .order('created_at', { ascending: false });

  if (error || !data) {
    return { ok: false, error: GENERIC_LOAD_ERROR };
  }
  return { ok: true, value: data };
}

/**
 * Share a post in a space. The author is forced to the caller's auth id and
 * the status is always 'pending' — a moderator approves it before anyone else
 * can see it. Pro is enforced on the server regardless of what the UI shows.
 */
export async function createPost(
  client: AppSupabaseClient,
  input: CreatePostInput,
): Promise<CommunityResult<CommunityPost>> {
  const invalid = validatePostBody(input.body);
  if (invalid) {
    return { ok: false, error: invalid };
  }

  const authorId = await getViewerId(client);
  if (!authorId) {
    return { ok: false, error: GENERIC_POST_ERROR };
  }

  const { data, error } = await client
    .from('community_posts')
    .insert({
      author_id: authorId,
      body: input.body.trim(),
      space: input.space,
      status: 'pending',
    })
    .select()
    .single();

  if (error || !data) {
    return { ok: false, error: GENERIC_POST_ERROR };
  }
  return { ok: true, value: data };
}

/** Delete a post. RLS allows only the author (or a moderator). */
export async function deletePost(
  client: AppSupabaseClient,
  id: string,
): Promise<CommunityResult<string>> {
  const { error } = await client.from('community_posts').delete().eq('id', id);
  if (error) {
    return { ok: false, error: GENERIC_DELETE_ERROR };
  }
  return { ok: true, value: id };
}

/** Send quiet support to an approved post. Idempotent: already-supported is ok. */
export async function addSupport(
  client: AppSupabaseClient,
  postId: string,
): Promise<CommunityResult<string>> {
  const userId = await getViewerId(client);
  if (!userId) {
    return { ok: false, error: GENERIC_SUPPORT_ERROR };
  }

  const { error } = await client.from('post_reactions').insert({
    post_id: postId,
    user_id: userId,
    reaction: SUPPORT_REACTION,
  });

  if (error && error.code !== UNIQUE_VIOLATION) {
    return { ok: false, error: GENERIC_SUPPORT_ERROR };
  }
  return { ok: true, value: postId };
}

/** Withdraw the caller's own support from a post. */
export async function removeSupport(
  client: AppSupabaseClient,
  postId: string,
): Promise<CommunityResult<string>> {
  const userId = await getViewerId(client);
  if (!userId) {
    return { ok: false, error: GENERIC_SUPPORT_ERROR };
  }

  const { error } = await client
    .from('post_reactions')
    .delete()
    .eq('post_id', postId)
    .eq('user_id', userId);

  if (error) {
    return { ok: false, error: GENERIC_SUPPORT_ERROR };
  }
  return { ok: true, value: postId };
}

/** Turn a list of post ids into a yes/no map (every id present). */
function toSupportMap(postIds: string[], yes: Set<string>): SupportMap {
  const map: SupportMap = {};
  for (const id of postIds) {
    map[id] = yes.has(id);
  }
  return map;
}

/** Which of these posts the caller has supported — booleans, never counts. */
export async function listMySupport(
  client: AppSupabaseClient,
  postIds: string[],
): Promise<CommunityResult<SupportMap>> {
  if (postIds.length === 0) {
    return { ok: true, value: {} };
  }
  const userId = await getViewerId(client);
  if (!userId) {
    return { ok: false, error: GENERIC_LOAD_ERROR };
  }

  const { data, error } = await client
    .from('post_reactions')
    .select('post_id')
    .eq('user_id', userId)
    .in('post_id', postIds);

  if (error || !data) {
    return { ok: false, error: GENERIC_LOAD_ERROR };
  }
  return {
    ok: true,
    value: toSupportMap(postIds, new Set(data.map((row) => row.post_id))),
  };
}

/**
 * For the caller's OWN posts: whether anyone else is with them. Booleans
 * only — the author is gently told "someone is with you", never how many.
 */
export async function listReceivedSupport(
  client: AppSupabaseClient,
  ownPostIds: string[],
): Promise<CommunityResult<SupportMap>> {
  if (ownPostIds.length === 0) {
    return { ok: true, value: {} };
  }
  const userId = await getViewerId(client);
  if (!userId) {
    return { ok: false, error: GENERIC_LOAD_ERROR };
  }

  const { data, error } = await client
    .from('post_reactions')
    .select('post_id')
    .in('post_id', ownPostIds)
    .neq('user_id', userId);

  if (error || !data) {
    return { ok: false, error: GENERIC_LOAD_ERROR };
  }
  return {
    ok: true,
    value: toSupportMap(ownPostIds, new Set(data.map((row) => row.post_id))),
  };
}

/**
 * Whether the caller has Pro (decides whether to SHOW the composer and the
 * support toggle). Authorization is always enforced by the server.
 */
export async function checkIsPro(
  client: AppSupabaseClient,
): Promise<CommunityResult<boolean>> {
  try {
    const { data, error } = await client.rpc('is_pro');
    if (error) {
      return { ok: false, error: GENERIC_PRO_ERROR };
    }
    return { ok: true, value: data === true };
  } catch {
    return { ok: false, error: GENERIC_PRO_ERROR };
  }
}
