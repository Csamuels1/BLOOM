import { type ReactNode, useEffect } from 'react';

import { getSupabaseClient, registerAuthAutoRefresh } from '@/lib/supabase';

import { useAuthStore } from './authStore';

/**
 * Wires the live Supabase client into the auth store and ties token
 * auto-refresh to app foreground state (issue #9). Renders its children
 * unconditionally; the root navigator reads `status` from the store to gate
 * routing. Building the client here (not at module load) means the app only
 * touches env when it actually mounts.
 */
export function AuthProvider({ children }: { children: ReactNode }): ReactNode {
  const initialize = useAuthStore((state) => state.initialize);

  useEffect(() => {
    const client = getSupabaseClient();
    const unsubscribeAuth = initialize(client);
    const unsubscribeRefresh = registerAuthAutoRefresh(client);

    return () => {
      unsubscribeAuth();
      unsubscribeRefresh();
    };
  }, [initialize]);

  return children;
}
