import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { OnboardingDraft } from './schema';
import {
  firstStepId,
  isOptionalStep,
  nextStepId,
  prevStepId,
  type OnboardingStepId,
} from './steps';

/**
 * Resumable onboarding state (issue #12).
 *
 * Persisted to AsyncStorage so an interrupted onboarding resumes where it left
 * off (draft + current step). This store is the ONLY place onboarding input
 * lives during Phase 3 — nothing is written to the backend here; profile
 * persistence to Supabase is Phase 4.
 */
export const ONBOARDING_STORAGE_KEY = 'bloom-onboarding-draft';

interface OnboardingState {
  draft: OnboardingDraft;
  currentStepId: OnboardingStepId;
  /** True once the persisted draft (if any) has been rehydrated. */
  hydrated: boolean;
  /** Merge validated step values into the draft. */
  patch: (fields: Partial<OnboardingDraft>) => void;
  /** Advance to the next reachable step (conditional on the current draft). */
  next: () => void;
  /** Return to the previous reachable step. */
  back: () => void;
  /** Skip an optional step without entering data. No-op on required steps. */
  skip: () => void;
  /** Jump to a specific step (e.g. editing from the preview). */
  goTo: (id: OnboardingStepId) => void;
  /** Clear the draft and return to the first step. */
  reset: () => void;
}

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set, get) => ({
      draft: {},
      currentStepId: firstStepId(),
      hydrated: false,

      patch: (fields) =>
        set((state) => ({ draft: { ...state.draft, ...fields } })),

      next: () => {
        const { currentStepId, draft } = get();
        const target = nextStepId(currentStepId, draft);
        if (target) set({ currentStepId: target });
      },

      back: () => {
        const { currentStepId, draft } = get();
        const target = prevStepId(currentStepId, draft);
        if (target) set({ currentStepId: target });
      },

      skip: () => {
        if (isOptionalStep(get().currentStepId)) get().next();
      },

      goTo: (id) => set({ currentStepId: id }),

      reset: () => set({ draft: {}, currentStepId: firstStepId() }),
    }),
    {
      name: ONBOARDING_STORAGE_KEY,
      storage: createJSONStorage(() => AsyncStorage),
      // Persist only the resumable data, not the methods or the hydrated flag.
      partialize: (state) => ({
        draft: state.draft,
        currentStepId: state.currentStepId,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) state.hydrated = true;
      },
    },
  ),
);
