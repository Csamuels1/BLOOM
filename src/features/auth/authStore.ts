import type { Session, SupabaseClient } from '@supabase/supabase-js';
import { create } from 'zustand';

/**
 * Auth session state (issue #9).
 *
 * `loading` is the pre-restoration state: the root navigator holds the splash
 * and shows neither the auth nor the app group until it resolves, so the guard
 * is never evaluated against an unknown session.
 */
export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

interface AuthState {
  status: AuthStatus;
  session: Session | null;
  /**
   * Subscribe to Supabase auth changes. A single `onAuthStateChange`
   * subscription covers every transition this issue must handle:
   * - restoration: the initial event replays the session persisted in storage;
   * - refresh: `TOKEN_REFRESHED` swaps in the new session and keeps the user in;
   * - expiry / failed refresh and sign-out: Supabase emits a null session,
   *   which drops the user to `unauthenticated`.
   *
   * Returns an unsubscribe function for teardown.
   */
  initialize: (client: SupabaseClient) => () => void;
  /** Sign out and clear the local session. */
  signOut: (client: SupabaseClient) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  status: 'loading',
  session: null,

  initialize: (client) => {
    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((_event, session) => {
      set({
        session,
        status: session ? 'authenticated' : 'unauthenticated',
      });
    });

    return () => subscription.unsubscribe();
  },

  signOut: async (client) => {
    await client.auth.signOut();
    // Do not optimistically clear here: `onAuthStateChange` emits the signed-out
    // session, keeping this store the single source of truth for auth state.
  },
}));
