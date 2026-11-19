import {
  deleteAccount,
  exportAccount,
  loadProfile,
  type Profile,
} from '@/features/profile';
import type { AppSupabaseClient } from '@/lib/supabase';
import type { Json } from '@/types/database';

/**
 * Settings data access (issue #52). Every call is RLS-scoped to the caller and
 * NEVER throws: a network failure or unexpected client error becomes a typed
 * failure result so the screen can always show a visible, retryable error
 * instead of failing silently.
 */

export type Result<T> = { ok: true; value: T } | { ok: false };

/** Read the caller's profile fresh from the server (null when not set up). */
export async function fetchSettingsProfile(
  client: AppSupabaseClient,
): Promise<Result<Profile | null>> {
  try {
    return { ok: true, value: await loadProfile(client) };
  } catch {
    return { ok: false };
  }
}

/**
 * Persist the cycle-tracking preference on the caller's own profile row
 * (RLS `profiles_update_own`) and return the row AS THE SERVER STORED IT, so the
 * UI reflects server truth rather than the value it asked for.
 */
export async function saveTrackCycle(
  client: AppSupabaseClient,
  userId: string,
  next: boolean,
): Promise<Result<Profile>> {
  try {
    const { data, error } = await client
      .from('profiles')
      .update({ track_cycle: next })
      .eq('id', userId)
      .select('*')
      .single();
    if (error || !data) return { ok: false };
    return { ok: true, value: data };
  } catch {
    return { ok: false };
  }
}

/** Build the caller's data export (null-safe, never throws). */
export async function requestExport(
  client: AppSupabaseClient,
): Promise<Result<Json>> {
  try {
    const data = await exportAccount(client);
    return data === null ? { ok: false } : { ok: true, value: data };
  } catch {
    return { ok: false };
  }
}

/** Delete the caller's account (signs out on success; never throws). */
export async function requestDeletion(
  client: AppSupabaseClient,
  userId: string,
): Promise<Result<null>> {
  try {
    const result = await deleteAccount(client, userId);
    return result.ok ? { ok: true, value: null } : { ok: false };
  } catch {
    return { ok: false };
  }
}

/**
 * Sign out, surfacing a failure instead of swallowing it. The auth store stays
 * the source of truth: `onAuthStateChange` emits the signed-out session.
 */
export async function requestSignOut(
  client: AppSupabaseClient,
): Promise<Result<null>> {
  try {
    const { error } = await client.auth.signOut();
    return error ? { ok: false } : { ok: true, value: null };
  } catch {
    return { ok: false };
  }
}
