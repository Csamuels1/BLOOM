import type { OnboardingDraft } from '@/features/onboarding';
import type { AppSupabaseClient } from '@/lib/supabase';
import type { Database, Json } from '@/types/database';

import { mapDraftToPayload } from './mapDraft';

export type Profile = Database['public']['Tables']['profiles']['Row'];

export type PersistResult =
  { ok: true; profile: Profile } | { ok: false; error: string };

const PRIVATE_BUCKETS = ['progress-photos', 'community-images'] as const;

/**
 * Account data access for the authenticated user (issue #20). Every call is
 * RLS-scoped to the caller; the server forces identity from auth.uid(), so none
 * of these can touch another account.
 */

/** Save the onboarding draft to the caller's profile (atomic upsert RPC). */
export async function persistOnboarding(
  client: AppSupabaseClient,
  draft: OnboardingDraft,
): Promise<PersistResult> {
  const { data, error } = await client.rpc('persist_onboarding', {
    p: mapDraftToPayload(draft) as Json,
  });
  if (error || !data) {
    return { ok: false, error: error?.message ?? 'Could not save your setup.' };
  }
  return { ok: true, profile: data };
}

/**
 * Load the caller's profile, or null if onboarding has not been saved. Throws on
 * a real query error (e.g. offline) so callers can distinguish a failed load
 * from an empty one and offer a retry.
 */
export async function loadProfile(
  client: AppSupabaseClient,
): Promise<Profile | null> {
  const { data, error } = await client
    .from('profiles')
    .select('*')
    .maybeSingle();
  if (error) {
    throw new Error(error.message);
  }
  return data ?? null;
}

/** Export the caller's own data as a single JSON document (authenticated). */
export async function exportAccount(
  client: AppSupabaseClient,
): Promise<Json | null> {
  const { data, error } = await client.rpc('export_current_user');
  return error ? null : (data ?? null);
}

/**
 * Delete the caller's account. Removes private Storage objects via the Storage
 * API first (direct SQL deletes are blocked), then the auth user (cascades to
 * all owned rows and invalidates sessions), then signs out to clear the local
 * session.
 */
export async function deleteAccount(
  client: AppSupabaseClient,
  userId: string,
): Promise<{ ok: boolean; error?: string }> {
  for (const bucket of PRIVATE_BUCKETS) {
    try {
      const { data: files } = await client.storage.from(bucket).list(userId);
      if (files && files.length > 0) {
        await client.storage
          .from(bucket)
          .remove(files.map((file) => `${userId}/${file.name}`));
      }
    } catch {
      // Best-effort cleanup; the account is still deleted below.
    }
  }

  const { error } = await client.rpc('delete_current_user');
  if (error) {
    return { ok: false, error: error.message };
  }

  await client.auth.signOut();
  return { ok: true };
}
