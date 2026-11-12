import { create } from 'zustand';

import type { AppSupabaseClient } from '@/lib/supabase';

import {
  deletePhoto,
  listPhotos,
  replacePhoto,
  signedUrl,
  uploadPhoto,
  type BytesReader,
  type PhotoAsset,
  type PhotoRef,
} from './photoService';

type PhotoStatus = 'idle' | 'loading' | 'loaded' | 'error';

/** A stored photo plus a short-lived signed URL for display (or null if unsigned). */
export interface PhotoItem extends PhotoRef {
  url: string | null;
}

/** Which gentle action, if any, is currently in flight. */
export type PhotoPending = 'adding' | 'replacing' | 'removing' | null;

interface PhotoState {
  items: PhotoItem[];
  status: PhotoStatus;
  /** An in-flight gentle action (for inline feedback), or null. */
  pending: PhotoPending;
  /** A gentle, user-facing error from the last action, or null. */
  error: string | null;
  /** Load the caller's own photos and sign them for display. Safe to retry. */
  load: (client: AppSupabaseClient, userId: string) => Promise<void>;
  /** Add a newly picked photo. Returns whether it succeeded. */
  add: (
    client: AppSupabaseClient,
    userId: string,
    asset: PhotoAsset,
    readBytes?: BytesReader,
  ) => Promise<boolean>;
  /** Replace one existing photo with a newly picked image. */
  replace: (
    client: AppSupabaseClient,
    userId: string,
    oldName: string,
    asset: PhotoAsset,
    readBytes?: BytesReader,
  ) => Promise<boolean>;
  /** Remove one of the caller's own photos. */
  remove: (
    client: AppSupabaseClient,
    userId: string,
    name: string,
  ) => Promise<boolean>;
  /** Dismiss the current gentle error. */
  clearError: () => void;
  /** Clear on sign-out/deletion. */
  clear: () => void;
}

/** Resolve a signed display URL for a stored photo (null if it cannot be signed). */
async function signItem(
  client: AppSupabaseClient,
  photo: PhotoRef,
): Promise<PhotoItem> {
  const result = await signedUrl(client, photo.path);
  return { ...photo, url: result.ok ? result.url : null };
}

export const usePhotoStore = create<PhotoState>((set, get) => ({
  items: [],
  status: 'idle',
  pending: null,
  error: null,

  load: async (client, userId) => {
    set({ status: 'loading', error: null });
    const result = await listPhotos(client, userId);
    if (!result.ok) {
      set({ status: 'error' });
      return;
    }
    const items = await Promise.all(
      result.photos.map((photo) => signItem(client, photo)),
    );
    set({ items, status: 'loaded' });
  },

  add: async (client, userId, asset, readBytes) => {
    set({ pending: 'adding', error: null });
    const result = await uploadPhoto(client, userId, asset, readBytes);
    if (!result.ok) {
      set({ pending: null, error: result.error });
      return false;
    }
    const item = await signItem(client, result.photo);
    set((state) => ({
      items: [item, ...state.items],
      status: 'loaded',
      pending: null,
    }));
    return true;
  },

  replace: async (client, userId, oldName, asset, readBytes) => {
    set({ pending: 'replacing', error: null });
    const result = await replacePhoto(
      client,
      userId,
      oldName,
      asset,
      readBytes,
    );
    if (!result.ok) {
      set({ pending: null, error: result.error });
      return false;
    }
    const item = await signItem(client, result.photo);
    set((state) => ({
      items: [
        item,
        ...state.items.filter((existing) => existing.name !== oldName),
      ],
      pending: null,
    }));
    return true;
  },

  remove: async (client, userId, name) => {
    set({ pending: 'removing', error: null });
    const result = await deletePhoto(client, userId, name);
    if (!result.ok) {
      set({ pending: null, error: result.error });
      return false;
    }
    set((state) => ({
      items: state.items.filter((existing) => existing.name !== name),
      pending: null,
    }));
    return true;
  },

  clearError: () => set({ error: null }),
  clear: () => set({ items: [], status: 'idle', pending: null, error: null }),
}));

/** True when the caller has no photos saved (used for the optional empty state). */
export function hasNoPhotos(items: PhotoItem[]): boolean {
  return items.length === 0;
}
