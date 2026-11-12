import { create } from 'zustand';

import type { AppSupabaseClient } from '@/lib/supabase';

import {
  deleteWeight,
  listWeights,
  logWeight,
  updateWeight,
  type LogWeightInput,
  type UpdateWeightInput,
  type WeightEntry,
} from './weightService';

type WeightStatus = 'idle' | 'loading' | 'loaded' | 'error';

interface WeightState {
  entries: WeightEntry[];
  status: WeightStatus;
  /** A gentle, retryable error message, or null when all is well. */
  error: string | null;
  /** Load the caller's entries (ordered). Safe to call again to retry. */
  load: (client: AppSupabaseClient) => Promise<void>;
  /** Create an entry; resolves true on success. On failure keeps state + sets error. */
  add: (client: AppSupabaseClient, input: LogWeightInput) => Promise<boolean>;
  /** Edit an entry; resolves true on success. Failure is non-destructive. */
  update: (
    client: AppSupabaseClient,
    id: string,
    patch: UpdateWeightInput,
  ) => Promise<boolean>;
  /** Remove an entry; resolves true on success. */
  remove: (client: AppSupabaseClient, id: string) => Promise<boolean>;
  /** Clear a surfaced error (e.g. once the user edits the form again). */
  clearError: () => void;
  /** Reset on sign-out. */
  clear: () => void;
}

/** Keep entries sorted most-recent measurement first (matches the server order). */
function sortEntries(entries: WeightEntry[]): WeightEntry[] {
  return [...entries].sort((a, b) => {
    if (a.measured_at !== b.measured_at) {
      return a.measured_at < b.measured_at ? 1 : -1;
    }
    return a.created_at < b.created_at ? 1 : -1;
  });
}

export const useWeightStore = create<WeightState>((set, get) => ({
  entries: [],
  status: 'idle',
  error: null,

  load: async (client) => {
    set({ status: 'loading', error: null });
    const result = await listWeights(client);
    if (result.ok) {
      set({ entries: result.value, status: 'loaded', error: null });
    } else {
      // Keep any entries already loaded; surface a retryable error.
      set({ status: 'error', error: result.error });
    }
  },

  add: async (client, input) => {
    set({ error: null });
    const result = await logWeight(client, input);
    if (result.ok) {
      set((state) => ({
        entries: sortEntries([result.value, ...state.entries]),
        status: 'loaded',
        error: null,
      }));
      return true;
    }
    // Non-destructive: entries are untouched, the caller keeps the user's input.
    set({ error: result.error });
    return false;
  },

  update: async (client, id, patch) => {
    set({ error: null });
    const result = await updateWeight(client, id, patch);
    if (result.ok) {
      const updated = result.value;
      set((state) => ({
        entries: sortEntries(
          state.entries.map((entry) => (entry.id === id ? updated : entry)),
        ),
        status: 'loaded',
        error: null,
      }));
      return true;
    }
    set({ error: result.error });
    return false;
  },

  remove: async (client, id) => {
    set({ error: null });
    const result = await deleteWeight(client, id);
    if (result.ok) {
      set((state) => ({
        entries: state.entries.filter((entry) => entry.id !== id),
      }));
      return true;
    }
    set({ error: result.error });
    return false;
  },

  clearError: () => set({ error: null }),
  clear: () => set({ entries: [], status: 'idle', error: null }),
}));

/** Re-export the length so callers can derive derived views if needed. */
export function hasEntries(state: Pick<WeightState, 'entries'>): boolean {
  return state.entries.length > 0;
}
