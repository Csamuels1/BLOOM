import { create } from 'zustand';

import type { AppSupabaseClient } from '@/lib/supabase';

import { loadProfile, type Profile } from './profileService';

type ProfileStatus = 'idle' | 'loading' | 'loaded';

interface ProfileState {
  profile: Profile | null;
  status: ProfileStatus;
  /** Load the caller's profile from the backend. */
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
    const profile = await loadProfile(client);
    set({ profile, status: 'loaded' });
  },
  setProfile: (profile) => set({ profile }),
  clear: () => set({ profile: null, status: 'idle' }),
}));

/** True once onboarding has been persisted for the loaded profile. */
export function hasCompletedOnboarding(profile: Profile | null): boolean {
  return profile?.onboarding_completed_at != null;
}
