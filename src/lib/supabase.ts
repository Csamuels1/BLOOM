import 'react-native-url-polyfill/auto';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { AppState, type AppStateStatus } from 'react-native';

import { getEnv } from '@/config/env';
import type { Database } from '@/types/database';

/** The app's Supabase client, typed against the generated database schema. */
export type AppSupabaseClient = SupabaseClient<Database>;

/**
 * Supabase client for the app (issue #9).
 *
 * Built lazily on first use so importing this module never throws when the
 * public env is unset (e.g. in unit tests); callers that need the client get a
 * clear error from {@link getEnv} at call time instead.
 *
 * The client holds only the public publishable (anon) key and persists the
 * session in AsyncStorage. The service-role key is never read here.
 */
let client: AppSupabaseClient | undefined;

export function getSupabaseClient(): AppSupabaseClient {
  if (!client) {
    const { supabaseUrl, supabasePublishableKey } = getEnv();
    client = createClient<Database>(supabaseUrl, supabasePublishableKey, {
      auth: {
        storage: AsyncStorage,
        // Refresh the access token before it expires while the app is active.
        autoRefreshToken: true,
        // Restore the session from AsyncStorage on relaunch.
        persistSession: true,
        // No URL-based session detection: this is a native app, not a browser
        // redirect flow, so leaving this on would mis-handle deep links.
        detectSessionInUrl: false,
      },
    });
  }
  return client;
}

/**
 * Tie Supabase token auto-refresh to the app's foreground state.
 *
 * supabase-js has no notion of an app being backgrounded, so on React Native we
 * start auto-refresh when the app is active and stop it otherwise (per Supabase
 * guidance). Returns an unsubscribe function for the caller to run on teardown.
 */
export function registerAuthAutoRefresh(
  supabase: SupabaseClient = getSupabaseClient(),
): () => void {
  const sync = (state: AppStateStatus): void => {
    if (state === 'active') {
      void supabase.auth.startAutoRefresh();
    } else {
      void supabase.auth.stopAutoRefresh();
    }
  };

  sync(AppState.currentState);
  const subscription = AppState.addEventListener('change', sync);
  return () => subscription.remove();
}

/** Test-only: drop the memoized client so a fresh env can be used. */
export function resetSupabaseClient(): void {
  client = undefined;
}
