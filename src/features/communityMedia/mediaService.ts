import type { AppSupabaseClient } from '@/lib/supabase';
import type { Database } from '@/types/database';

import {
  validateMediaAsset,
  validateMediaType,
  type MediaAsset,
  type MediaInvalidReason,
} from './validation';

/**
 * Community post images (issue #39). Every object lives in the PRIVATE
 * `community-images` bucket under `"{userId}/{fileName}"`. Storage RLS lets the
 * owner read/write their own prefix, moderators read everything, and anyone else
 * read an object ONLY when it is approved media on an approved post. Each object
 * has a `post_media` row that starts as `pending`; members can never change its
 * status (only moderator functions can).
 *
 * Images are displayed only through short-lived signed URLs — never public URLs.
 * A signed URL can only be created when the viewer may read the object, so
 * pending and rejected media simply do not resolve for anyone but the author
 * (and moderators).
 */

const BUCKET = 'community-images' as const;
const TABLE = 'post_media' as const;

/** How long a display URL stays valid, in seconds (one hour). */
export const MEDIA_SIGNED_URL_TTL_SECONDS = 60 * 60;

export type PostMediaRow = Database['public']['Tables']['post_media']['Row'];

export type PostMediaStatus = 'pending' | 'approved' | 'rejected';

/** A `post_media` row with its status narrowed to the known values. */
export interface PostMedia extends Omit<PostMediaRow, 'status'> {
  status: PostMediaStatus;
}

/** Reads an asset's bytes. Injectable so the upload path is unit-testable. */
export type BytesReader = (uri: string) => Promise<ArrayBuffer>;

const defaultReadBytes: BytesReader = async (uri) => {
  const response = await fetch(uri);
  return response.arrayBuffer();
};

export type UploadMediaResult =
  | { ok: true; media: PostMedia }
  | { ok: false; kind: 'invalid'; reason: MediaInvalidReason }
  | { ok: false; kind: 'error'; error: string };

export type MediaResult = { ok: true } | { ok: false; error: string };

/** Narrow an unknown status string; anything unexpected is treated as pending. */
export function toStatus(value: string): PostMediaStatus {
  return value === 'approved' || value === 'rejected' ? value : 'pending';
}

function toPostMedia(row: PostMediaRow): PostMedia {
  return { ...row, status: toStatus(row.status) };
}

function messageOf(cause: unknown, fallback: string): string {
  return cause instanceof Error ? cause.message : fallback;
}

/** The full, ownership-scoped storage path for an object name. */
export function mediaPath(userId: string, name: string): string {
  return `${userId}/${name}`;
}

/** A collision-resistant object name within one user's prefix. */
export function buildMediaObjectName(extension: string): string {
  const stamp = Date.now();
  const rand = Math.random().toString(36).slice(2, 10);
  return `${stamp}-${rand}.${extension}`;
}

/**
 * Upload one image for a post the caller authored. Steps:
 * 1. validate the kind of file, then read the bytes and validate the real size;
 * 2. upload to `"{userId}/{generatedName}"` (never overwriting);
 * 3. insert a `post_media` row with status `pending`;
 * 4. if the row insert fails, remove the uploaded object so nothing is orphaned.
 */
export async function uploadPostMedia(
  client: AppSupabaseClient,
  userId: string,
  postId: string,
  asset: MediaAsset,
  readBytes: BytesReader = defaultReadBytes,
): Promise<UploadMediaResult> {
  const kind = validateMediaType(asset);
  if (!kind.ok) return { ok: false, kind: 'invalid', reason: kind.reason };

  let bytes: ArrayBuffer;
  try {
    bytes = await readBytes(asset.uri);
  } catch (cause) {
    return {
      ok: false,
      kind: 'error',
      error: messageOf(cause, 'Could not read the image.'),
    };
  }

  // The real byte length is authoritative over whatever the picker reported.
  const checked = validateMediaAsset({ ...asset, fileSize: bytes.byteLength });
  if (!checked.ok) {
    return { ok: false, kind: 'invalid', reason: checked.reason };
  }
  const { mimeType, sizeBytes, extension } = checked.media;

  const path = mediaPath(userId, buildMediaObjectName(extension));
  const storage = client.storage.from(BUCKET);

  try {
    const { error: uploadError } = await storage.upload(path, bytes, {
      contentType: mimeType,
      upsert: false,
    });
    if (uploadError) {
      return { ok: false, kind: 'error', error: uploadError.message };
    }
  } catch (cause) {
    return {
      ok: false,
      kind: 'error',
      error: messageOf(cause, 'Upload failed.'),
    };
  }

  const removeOrphan = async () => {
    try {
      await storage.remove([path]);
    } catch {
      // Best effort: the object stays private to its owner either way.
    }
  };

  try {
    const { data, error } = await client
      .from(TABLE)
      .insert({
        post_id: postId,
        author_id: userId,
        storage_path: path,
        mime_type: mimeType,
        size_bytes: sizeBytes,
        status: 'pending',
      })
      .select()
      .single();
    if (error || !data) {
      await removeOrphan();
      return {
        ok: false,
        kind: 'error',
        error: error?.message ?? 'Could not save the image.',
      };
    }
    return { ok: true, media: toPostMedia(data) };
  } catch (cause) {
    await removeOrphan();
    return {
      ok: false,
      kind: 'error',
      error: messageOf(cause, 'Could not save the image.'),
    };
  }
}

/**
 * List the media rows the caller may see for these posts. RLS returns the
 * caller's own rows (any status) and approved media on approved posts only.
 */
export async function listPostMedia(
  client: AppSupabaseClient,
  postIds: readonly string[],
): Promise<{ ok: true; media: PostMedia[] } | { ok: false; error: string }> {
  if (postIds.length === 0) return { ok: true, media: [] };
  const { data, error } = await client
    .from(TABLE)
    .select('*')
    .in('post_id', [...postIds])
    .order('created_at', { ascending: true });
  if (error) return { ok: false, error: error.message };
  return { ok: true, media: (data ?? []).map(toPostMedia) };
}

/**
 * Create a short-lived signed URL for a private image. Public URLs are never
 * used. For pending or rejected media this fails for everyone but the author
 * (and moderators), which is exactly the point.
 */
export async function signedMediaUrl(
  client: AppSupabaseClient,
  storagePath: string,
  expiresInSeconds: number = MEDIA_SIGNED_URL_TTL_SECONDS,
): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  try {
    const { data, error } = await client.storage
      .from(BUCKET)
      .createSignedUrl(storagePath, expiresInSeconds);
    if (error || !data?.signedUrl) {
      return {
        ok: false,
        error: error?.message ?? 'Could not load the image.',
      };
    }
    return { ok: true, url: data.signedUrl };
  } catch (cause) {
    return { ok: false, error: messageOf(cause, 'Could not load the image.') };
  }
}

/**
 * Delete one of the caller's own images: the row first (so it can no longer be
 * resolved as approved media), then the stored object.
 */
export async function deletePostMedia(
  client: AppSupabaseClient,
  media: Pick<PostMedia, 'id' | 'storage_path'>,
): Promise<MediaResult> {
  try {
    const { error: rowError } = await client
      .from(TABLE)
      .delete()
      .eq('id', media.id);
    if (rowError) return { ok: false, error: rowError.message };

    const { error: objectError } = await client.storage
      .from(BUCKET)
      .remove([media.storage_path]);
    if (objectError) return { ok: false, error: objectError.message };
    return { ok: true };
  } catch (cause) {
    return {
      ok: false,
      error: messageOf(cause, 'Could not remove the image.'),
    };
  }
}
