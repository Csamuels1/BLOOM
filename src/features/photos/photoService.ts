import type { AppSupabaseClient } from '@/lib/supabase';

/**
 * Private photos data access (issue #27). Every object lives in the private
 * `progress-photos` bucket under `"{userId}/{filename}"`. The Storage RLS policy
 * `progress_photos_rw_own` enforces that the first path segment equals
 * `auth.uid()`, so a caller can only ever touch their own objects. This client
 * code mirrors that: every path it builds is prefixed with the caller's id, so
 * ownership is enforced on both sides. The bucket is private, so images are only
 * ever displayed through short-lived signed URLs — never public URLs.
 *
 * These photos are the user's own private keepsakes. There is no before/after or
 * comparison framing anywhere in this feature.
 */

const BUCKET = 'progress-photos' as const;

/** How long a display URL stays valid, in seconds (one hour). */
export const SIGNED_URL_TTL_SECONDS = 60 * 60;

/** A stored photo belonging to the caller. */
export interface PhotoRef {
  /** The bare object name (no user prefix), e.g. `1699999999-ab12.jpg`. */
  name: string;
  /** The full storage path, always `"{userId}/{name}"`. */
  path: string;
}

/** The minimal shape this module needs from an image-picker asset. */
export interface PhotoAsset {
  /** Local URI to the picked image. */
  uri: string;
  /** Original file name, if the picker provided one. */
  fileName?: string | null;
  /** MIME type, if the picker provided one. */
  mimeType?: string | null;
}

/** Discriminated result for an op that returns nothing meaningful on success. */
export type PhotoResult = { ok: true } | { ok: false; error: string };

/** Reads an asset's bytes. Injectable so the upload path is unit-testable. */
export type BytesReader = (uri: string) => Promise<ArrayBuffer>;

const defaultReadBytes: BytesReader = async (uri) => {
  const response = await fetch(uri);
  return response.arrayBuffer();
};

/** Map a MIME type to a file extension; falls back to `jpg`. */
function extensionFor(asset: PhotoAsset): string {
  const fromName = asset.fileName?.split('.').pop();
  if (fromName && fromName !== asset.fileName) {
    return fromName.toLowerCase();
  }
  const fromMime = asset.mimeType?.split('/').pop();
  return (fromMime ?? 'jpg').toLowerCase();
}

/**
 * Build a collision-resistant object name for a new photo. The path is always
 * scoped to the caller, so this only needs to be unique within one user's space.
 */
export function buildObjectName(asset: PhotoAsset): string {
  const stamp = Date.now();
  const rand = Math.random().toString(36).slice(2, 8);
  return `${stamp}-${rand}.${extensionFor(asset)}`;
}

/** The full, ownership-scoped storage path for an object name. */
export function photoPath(userId: string, name: string): string {
  return `${userId}/${name}`;
}

/** List the caller's own photos (names + ownership-scoped paths). */
export async function listPhotos(
  client: AppSupabaseClient,
  userId: string,
): Promise<{ ok: true; photos: PhotoRef[] } | { ok: false; error: string }> {
  const { data, error } = await client.storage.from(BUCKET).list(userId);
  if (error) {
    return { ok: false, error: error.message };
  }
  const photos: PhotoRef[] = (data ?? []).map((file) => ({
    name: file.name,
    path: photoPath(userId, file.name),
  }));
  return { ok: true, photos };
}

/**
 * Upload a picked image into the caller's own space. The path is always
 * `"{userId}/{name}"`, so RLS accepts it only for the authenticated owner.
 */
export async function uploadPhoto(
  client: AppSupabaseClient,
  userId: string,
  asset: PhotoAsset,
  readBytes: BytesReader = defaultReadBytes,
): Promise<{ ok: true; photo: PhotoRef } | { ok: false; error: string }> {
  const name = buildObjectName(asset);
  const path = photoPath(userId, name);
  try {
    const bytes = await readBytes(asset.uri);
    const { error } = await client.storage.from(BUCKET).upload(path, bytes, {
      contentType: asset.mimeType ?? 'image/jpeg',
      upsert: false,
    });
    if (error) {
      return { ok: false, error: error.message };
    }
    return { ok: true, photo: { name, path } };
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : 'Upload failed.';
    return { ok: false, error: message };
  }
}

/**
 * Create a short-lived signed URL for displaying a private photo. Public URLs
 * are never used because the bucket is private.
 */
export async function signedUrl(
  client: AppSupabaseClient,
  path: string,
  expiresInSeconds: number = SIGNED_URL_TTL_SECONDS,
): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  const { data, error } = await client.storage
    .from(BUCKET)
    .createSignedUrl(path, expiresInSeconds);
  if (error || !data?.signedUrl) {
    return { ok: false, error: error?.message ?? 'Could not load the photo.' };
  }
  return { ok: true, url: data.signedUrl };
}

/**
 * Replace one photo with a newly picked image: upload the new object, then
 * remove the old one. Both operations are scoped to the caller's own paths. If
 * the old object cannot be removed, the new one is rolled back so the user is
 * never left with an unintended duplicate.
 */
export async function replacePhoto(
  client: AppSupabaseClient,
  userId: string,
  oldName: string,
  asset: PhotoAsset,
  readBytes: BytesReader = defaultReadBytes,
): Promise<{ ok: true; photo: PhotoRef } | { ok: false; error: string }> {
  const uploaded = await uploadPhoto(client, userId, asset, readBytes);
  if (!uploaded.ok) {
    return uploaded;
  }
  const removed = await deletePhoto(client, userId, oldName);
  if (!removed.ok) {
    // Roll back the new upload so a failed replace is a no-op for the user.
    await deletePhoto(client, userId, uploaded.photo.name);
    return { ok: false, error: removed.error };
  }
  return uploaded;
}

/** Remove one of the caller's own photos by bare object name. */
export async function deletePhoto(
  client: AppSupabaseClient,
  userId: string,
  name: string,
): Promise<PhotoResult> {
  const { error } = await client.storage
    .from(BUCKET)
    .remove([photoPath(userId, name)]);
  if (error) {
    return { ok: false, error: error.message };
  }
  return { ok: true };
}
