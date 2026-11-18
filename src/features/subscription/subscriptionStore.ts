import { create } from 'zustand';

import type { AppSupabaseClient } from '@/lib/supabase';

import { fetchEntitlement, type Entitlement } from './entitlementService';

/**
 * Client entitlement cache (issue #45).
 *
 * The server is always the authority; this cache only decides what the UI shows.
 * Two safety rules are built in:
 *   - Offline cache expiry: a cached entitlement is trusted for at most
 *     ENTITLEMENT_TTL_MS. After that (or on a failed read with no fresh cache)
 *     the client falls back to Free until it re-verifies with the server.
 *   - No cross-account leak: the cache is keyed to the user it was read for
 *     (ownerId). A different user never reads another user's cached Pro, and
 *     sign-out clears it.
 */

/** How long a cached entitlement is trusted without re-verification (24h). */
export const ENTITLEMENT_TTL_MS = 24 * 60 * 60 * 1000;

type LoadStatus = 'idle' | 'loading' | 'loaded' | 'error';

interface SubscriptionState {
  entitlement: Entitlement | null;
  /** When the entitlement was last confirmed with the server (epoch ms). */
  checkedAt: number | null;
  /** The user id the cached entitlement belongs to. */
  ownerId: string | null;
  status: LoadStatus;

  /** Read the signed-in user's entitlement from the server and cache it. */
  load: (client: AppSupabaseClient, userId: string) => Promise<void>;
  /** Drop the cache when the signed-in user changes or signs out. */
  syncUser: (userId: string | null) => void;
  clear: () => void;
}

const EMPTY = {
  entitlement: null,
  checkedAt: null,
  ownerId: null,
  status: 'idle' as LoadStatus,
};

export const useSubscriptionStore = create<SubscriptionState>((set, get) => ({
  ...EMPTY,

  load: async (client, userId) => {
    // A load for a different user than the cache holds starts clean, so a
    // pending/old value is never shown to the new user.
    if (get().ownerId !== userId) {
      set({ ...EMPTY, status: 'loading', ownerId: userId });
    } else {
      set({ status: 'loading' });
    }

    const result = await fetchEntitlement(client);
    if (result === null) {
      // Read failed. Keep a still-fresh cache for the SAME user (offline
      // tolerance); never keep one across a user change.
      set((state) =>
        state.ownerId === userId
          ? { status: 'error' }
          : { ...EMPTY, status: 'error' },
      );
      return;
    }
    set({
      entitlement: result,
      checkedAt: Date.now(),
      ownerId: userId,
      status: 'loaded',
    });
  },

  syncUser: (userId) => {
    if (get().ownerId !== userId) {
      set({ ...EMPTY });
    }
  },

  clear: () => set({ ...EMPTY }),
}));

/**
 * Whether `userId` has Pro right now, from the cache. True only when the cache
 * belongs to that same user, is still within the TTL, and says Pro. Any mismatch
 * or staleness returns false, so entitlement never leaks across accounts and a
 * stale cache fails safe to Free.
 */
export function selectIsPro(
  state: Pick<SubscriptionState, 'entitlement' | 'checkedAt' | 'ownerId'>,
  userId: string | null | undefined,
  now: number = Date.now(),
): boolean {
  return (
    userId != null &&
    state.ownerId === userId &&
    state.entitlement?.isPro === true &&
    state.checkedAt != null &&
    now - state.checkedAt < ENTITLEMENT_TTL_MS
  );
}
