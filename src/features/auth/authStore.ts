import type { Session, SupabaseClient } from '@supabase/supabase-js';
import { create } from 'zustand';

/**
 * Auth session state (issues #9, #10).
 *
 * `loading` is the pre-restoration state: the root navigator holds the splash
 * and shows no group until it resolves, so the guard is never evaluated against
 * an unknown session. `recovering` is set when the user opens a password-reset
 * link (Supabase emits `PASSWORD_RECOVERY`); while true the navigator routes to
 * the set-new-password screen instead of the app.
 */
export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

interface AuthState {
  status: AuthStatus;
  session: Session | null;
  recovering: boolean;
  /**
   * Subscribe to Supabase auth changes. A single `onAuthStateChange`
   * subscription covers every transition these issues must handle:
   * - restoration: the initial event replays the session persisted in storage;
   * - refresh: `TOKEN_REFRESHED` swaps in the new session and keeps the user in;
   * - expiry / failed refresh and sign-out: a null session drops to
   *   `unauthenticated` and clears any recovery;
   * - recovery: `PASSWORD_RECOVERY` flags that a new password must be set.
   *
   * Returns an unsubscribe function for teardown.
   */
  initialize: (client: SupabaseClient) => () => void;
  /** Sign out and clear the local session. */
  signOut: (client: SupabaseClient) => Promise<void>;
  /** Clear the recovery flag once the new password is saved. */
  endRecovery: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  status: 'loading',
  session: null,
  recovering: false,

  initialize: (client) => {
    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((event, session) => {
      set((prev) => ({
        session,
        status: session ? 'authenticated' : 'unauthenticated',
        recovering:
          event === 'PASSWORD_RECOVERY'
            ? true
            : session
              ? prev.recovering
              : false,
      }));
    });

    return () => subscription.unsubscribe();
  },

  signOut: async (client) => {
    await client.auth.signOut();
    // Do not optimistically clear here: `onAuthStateChange` emits the signed-out
    // session, keeping this store the single source of truth for auth state.
  },

  endRecovery: () => set({ recovering: false }),
}));
