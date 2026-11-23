import { useState } from 'react';

import { useAuthStore } from '@/features/auth';
import { useProfileStore } from '@/features/profile';
import { saveTrackCycle } from '@/features/settings';
import { getSupabaseClient, type AppSupabaseClient } from '@/lib/supabase';

/**
 * The cycle-tracking preference, kept honest (Phase 12 gate, #54).
 *
 * The toggle shows the new value straight away. Then:
 * - on success, it adopts the value the SERVER stored (server truth) and
 *   updates the profile store;
 * - on failure (including a thrown request or no session), it reverts to the
 *   previous value and raises `saveError`, so nothing ever fails silently.
 * `retry` re-attempts the last change.
 */
export function useTrackingPreference(client?: AppSupabaseClient) {
  const profile = useProfileStore((state) => state.profile);
  const setProfile = useProfileStore((state) => state.setProfile);
  const userId = useAuthStore((state) => state.session?.user.id);

  const [tracking, setTracking] = useState(profile?.track_cycle ?? true);
  const [saveError, setSaveError] = useState(false);
  const [lastAttempt, setLastAttempt] = useState<boolean | null>(null);

  const change = async (next: boolean): Promise<boolean> => {
    const previous = tracking;
    setTracking(next);
    setSaveError(false);
    setLastAttempt(next);

    if (!userId) {
      setTracking(previous);
      setSaveError(true);
      return false;
    }
    const result = await saveTrackCycle(
      client ?? getSupabaseClient(),
      userId,
      next,
    );
    if (!result.ok) {
      setTracking(previous);
      setSaveError(true);
      return false;
    }
    setTracking(result.value.track_cycle);
    setProfile(result.value);
    return true;
  };

  const retry = async (): Promise<boolean> =>
    lastAttempt === null ? false : change(lastAttempt);

  return { tracking, saveError, change, retry };
}
