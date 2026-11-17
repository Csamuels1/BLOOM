/**
 * Pure, client-side validation for a community post image (issue #39). It mirrors
 * the server limits on the private `community-images` bucket and the
 * `post_media` table (JPEG/PNG/WebP, 1 byte to 5 MB). The server still enforces
 * every rule; this exists so a member gets a gentle, specific reason before any
 * bytes leave the device.
 */

/** Maximum image size in bytes (5 MB), matching the bucket and table limits. */
export const MAX_MEDIA_BYTES = 5 * 1024 * 1024;

/** The MIME types the server accepts. */
export const ALLOWED_MEDIA_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
] as const;

export type MediaMimeType = (typeof ALLOWED_MEDIA_MIME_TYPES)[number];

/** File extensions we accept, mapped to the MIME type they imply. */
const EXTENSION_MIME: Record<string, MediaMimeType> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
};

/** Canonical extension for each accepted MIME type (used for object names). */
export const MIME_EXTENSION: Record<MediaMimeType, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

/** The minimal shape this feature needs from an image-picker asset. */
export interface MediaAsset {
  /** Local URI to the picked image. */
  uri: string;
  /** Original file name, if the picker provided one. */
  fileName?: string | null;
  /** MIME type, if the picker provided one. */
  mimeType?: string | null;
  /** Size in bytes, if the picker provided one. */
  fileSize?: number | null;
}

/** Why an asset was refused; each maps to a gentle line of copy. */
export type MediaInvalidReason = 'type' | 'empty' | 'tooLarge' | 'extension';

/** A validated asset: MIME type and size are known and within limits. */
export interface ValidMedia {
  uri: string;
  mimeType: MediaMimeType;
  sizeBytes: number;
  extension: string;
}

export type MediaValidation =
  { ok: true; media: ValidMedia } | { ok: false; reason: MediaInvalidReason };

function isAllowedMime(value: string): value is MediaMimeType {
  return (ALLOWED_MEDIA_MIME_TYPES as readonly string[]).includes(value);
}

/** Lower-cased extension from a file name or URI, or null if there is none. */
export function extensionOf(name: string | null | undefined): string | null {
  if (!name) return null;
  const clean = name.split(/[?#]/)[0] ?? '';
  const last = clean.split('/').pop() ?? '';
  const dot = last.lastIndexOf('.');
  if (dot <= 0 || dot === last.length - 1) return null;
  return last.slice(dot + 1).toLowerCase();
}

export type MediaTypeValidation =
  | { ok: true; mimeType: MediaMimeType }
  | { ok: false; reason: 'type' | 'extension' };

/**
 * Check only the kind of file: the MIME type comes from the picker, falling back
 * to the file extension when the picker gives none. A present extension must be
 * an image extension that agrees with the MIME type. Used on its own when the
 * picker does not report a size (the size is then checked on the real bytes).
 */
export function validateMediaType(asset: MediaAsset): MediaTypeValidation {
  const ext = extensionOf(asset.fileName) ?? extensionOf(asset.uri);
  const rawMime = asset.mimeType?.trim().toLowerCase() || null;

  let mimeType: MediaMimeType;
  if (rawMime) {
    if (!isAllowedMime(rawMime)) return { ok: false, reason: 'type' };
    mimeType = rawMime;
  } else {
    const implied = ext ? EXTENSION_MIME[ext] : undefined;
    if (!implied) return { ok: false, reason: 'type' };
    mimeType = implied;
  }

  if (ext !== null) {
    const implied = EXTENSION_MIME[ext];
    if (!implied || implied !== mimeType) {
      return { ok: false, reason: 'extension' };
    }
  }
  return { ok: true, mimeType };
}

/**
 * Validate a picked asset before upload: the file kind (see
 * {@link validateMediaType}) and the size, which must be known, greater than
 * zero, and at most 5 MB.
 */
export function validateMediaAsset(asset: MediaAsset): MediaValidation {
  const kind = validateMediaType(asset);
  if (!kind.ok) return kind;
  const { mimeType } = kind;

  const size = asset.fileSize;
  if (typeof size !== 'number' || !Number.isFinite(size) || size <= 0) {
    return { ok: false, reason: 'empty' };
  }
  if (size > MAX_MEDIA_BYTES) return { ok: false, reason: 'tooLarge' };

  return {
    ok: true,
    media: {
      uri: asset.uri,
      mimeType,
      sizeBytes: Math.round(size),
      extension: MIME_EXTENSION[mimeType],
    },
  };
}
