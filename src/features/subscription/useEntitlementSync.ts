import { useEffect } from 'react';

import { useAuthStore } from '@/features/auth';
import { getSupabaseClient } from '@/lib/supabase';

import { useSubscriptionStore } from './subscriptionStore';

/**
 * Keep the cached entitlement in step with the signed-in user (issue #45).
 *
 * On every change of the signed-in user id it first drops any cache that does
 * not belong to the new user (so a previous account's Pro never shows after a
 * switch or sign-out), then, when signed in, reads the current user's
 * entitlement from the server. Mount once inside the authenticated area.
 */
export function useEntitlementSync(): void {
  const userId = useAuthStore((state) => state.session?.user.id ?? null);
  const syncUser = useSubscriptionStore((state) => state.syncUser);
  const load = useSubscriptionStore((state) => state.load);

  useEffect(() => {
    syncUser(userId);
    if (userId) {
      void load(getSupabaseClient(), userId);
    }
  }, [userId, syncUser, load]);
}
