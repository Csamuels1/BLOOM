import { create } from 'zustand';

import type { AppSupabaseClient } from '@/lib/supabase';

import { loadProfile, type Profile } from './profileService';

type ProfileStatus = 'idle' | 'loading' | 'loaded' | 'error';

interface ProfileState {
  profile: Profile | null;
  status: ProfileStatus;
  /** Load the caller's profile from the backend. Safe to call again to retry. */
  load: (client: AppSupabaseClient) => Promise<void>;
  setProfile: (profile: Profile | null) => void;
  /** Clear on sign-out/deletion. */
  clear: () => void;
}

export const useProfileStore = create<ProfileState>((set) => ({
  profile: null,
  status: 'idle',
  load: async (client) => {
    set({ status: 'loading' });
    try {
      const profile = await loadProfile(client);
      set({ profile, status: 'loaded' });
    } catch {
      // Keep any previously loaded profile; surface a retryable error state.
      set({ status: 'error' });
    }
  },
  setProfile: (profile) => set({ profile, status: 'loaded' }),
  clear: () => set({ profile: null, status: 'idle' }),
}));

/** True once onboarding has been persisted for the loaded profile. */
export function hasCompletedOnboarding(profile: Profile | null): boolean {
  return profile?.onboarding_completed_at != null;
}
