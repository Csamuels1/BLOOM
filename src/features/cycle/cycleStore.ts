import { create } from 'zustand';

import type { AppSupabaseClient } from '@/lib/supabase';

import {
  addCycleStart,
  deleteAllCycleHistory,
  deleteCycleStart,
  listCycleStarts,
  type CycleStart,
} from './cycleService';

type CycleStatus = 'idle' | 'loading' | 'loaded' | 'error';

interface CycleState {
  entries: CycleStart[];
  status: CycleStatus;
  /** A gentle, retryable error message, or null when all is well. */
  error: string | null;
  /** Load the caller's start dates (ordered). Safe to call again to retry. */
  load: (client: AppSupabaseClient) => Promise<void>;
  /** Record a start date; resolves true on success. Failure is non-destructive. */
  add: (client: AppSupabaseClient, startedOn: string) => Promise<boolean>;
  /** Remove a start date; resolves true on success. */
  remove: (client: AppSupabaseClient, id: string) => Promise<boolean>;
  /** Delete all history (disable flow); resolves true on success. */
  clearHistory: (client: AppSupabaseClient) => Promise<boolean>;
  /** Clear a surfaced error (e.g. once the user edits the form again). */
  clearError: () => void;
  /** Reset on sign-out. */
  clear: () => void;
}

/** Keep starts sorted most-recent first (matches the server order). */
function sortStarts(entries: CycleStart[]): CycleStart[] {
  return [...entries].sort((a, b) => {
    if (a.started_on !== b.started_on) {
      return a.started_on < b.started_on ? 1 : -1;
    }
    return a.created_at < b.created_at ? 1 : -1;
  });
}

export const useCycleStore = create<CycleState>((set) => ({
  entries: [],
  status: 'idle',
  error: null,

  load: async (client) => {
    set({ status: 'loading', error: null });
    const result = await listCycleStarts(client);
    if (result.ok) {
      set({ entries: result.value, status: 'loaded', error: null });
    } else {
      // Keep any entries already loaded; surface a retryable error.
      set({ status: 'error', error: result.error });
    }
  },

  add: async (client, startedOn) => {
    set({ error: null });
    const result = await addCycleStart(client, startedOn);
    if (result.ok) {
      set((state) => ({
        entries: sortStarts([result.value, ...state.entries]),
        status: 'loaded',
        error: null,
      }));
      return true;
    }
    // Non-destructive: entries are untouched, the caller keeps the user's input.
    set({ error: result.error });
    return false;
  },

  remove: async (client, id) => {
    set({ error: null });
    const result = await deleteCycleStart(client, id);
    if (result.ok) {
      set((state) => ({
        entries: state.entries.filter((entry) => entry.id !== id),
      }));
      return true;
    }
    set({ error: result.error });
    return false;
  },

  clearHistory: async (client) => {
    set({ error: null });
    const result = await deleteAllCycleHistory(client);
    if (result.ok) {
      set({ entries: [], status: 'loaded', error: null });
      return true;
    }
    // Non-destructive on failure: keep the dates so nothing is silently lost.
    set({ error: result.error });
    return false;
  },

  clearError: () => set({ error: null }),
  clear: () => set({ entries: [], status: 'idle', error: null }),
}));

/** True when there is at least one recorded start. */
export function hasCycleStarts(state: Pick<CycleState, 'entries'>): boolean {
  return state.entries.length > 0;
}
