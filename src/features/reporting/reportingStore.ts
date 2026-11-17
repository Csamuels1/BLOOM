import { create } from 'zustand';

import type { AppSupabaseClient } from '@/lib/supabase';

import {
  blockMember,
  listMyBlocks,
  listMyReports,
  reportPost,
  unblockMember,
  type MyBlock,
  type MyReport,
  type ReportOutcome,
  type ReportPostInput,
} from './reportingService';

type LoadStatus = 'idle' | 'loading' | 'loaded' | 'error';

interface ReportingState {
  /** The caller's own reports (never anyone else's). */
  reports: MyReport[];
  reportsStatus: LoadStatus;
  /** The caller's blocks. */
  blocks: MyBlock[];
  blocksStatus: LoadStatus;
  /** A gentle, retryable error message, or null when all is well. */
  error: string | null;

  loadReports: (client: AppSupabaseClient) => Promise<void>;
  loadBlocks: (client: AppSupabaseClient) => Promise<void>;
  /** Send a report; resolves the outcome, or null on failure (error is set). */
  report: (
    client: AppSupabaseClient,
    input: ReportPostInput,
  ) => Promise<ReportOutcome | null>;
  /** Block a member; resolves true on success. */
  block: (client: AppSupabaseClient, memberId: string) => Promise<boolean>;
  /** Unblock a member; resolves true on success. */
  unblock: (client: AppSupabaseClient, memberId: string) => Promise<boolean>;
  clearError: () => void;
  /** Reset on sign-out. */
  clear: () => void;
}

export const useReportingStore = create<ReportingState>((set) => ({
  reports: [],
  reportsStatus: 'idle',
  blocks: [],
  blocksStatus: 'idle',
  error: null,

  loadReports: async (client) => {
    set({ reportsStatus: 'loading', error: null });
    const result = await listMyReports(client);
    if (result.ok) {
      set({ reports: result.value, reportsStatus: 'loaded' });
    } else {
      set({ reportsStatus: 'error', error: result.error });
    }
  },

  loadBlocks: async (client) => {
    set({ blocksStatus: 'loading', error: null });
    const result = await listMyBlocks(client);
    if (result.ok) {
      set({ blocks: result.value, blocksStatus: 'loaded' });
    } else {
      set({ blocksStatus: 'error', error: result.error });
    }
  },

  report: async (client, input) => {
    set({ error: null });
    const result = await reportPost(client, input);
    if (result.ok) {
      return result.value;
    }
    set({ error: result.error });
    return null;
  },

  block: async (client, memberId) => {
    set({ error: null });
    const result = await blockMember(client, memberId);
    if (result.ok) {
      const added = result.value;
      set((state) => ({
        blocks: [
          added,
          ...state.blocks.filter((b) => b.blocked_id !== added.blocked_id),
        ],
      }));
      return true;
    }
    set({ error: result.error });
    return false;
  },

  unblock: async (client, memberId) => {
    set({ error: null });
    const result = await unblockMember(client, memberId);
    if (result.ok) {
      set((state) => ({
        blocks: state.blocks.filter((b) => b.blocked_id !== memberId),
      }));
      return true;
    }
    set({ error: result.error });
    return false;
  },

  clearError: () => set({ error: null }),
  clear: () =>
    set({
      reports: [],
      reportsStatus: 'idle',
      blocks: [],
      blocksStatus: 'idle',
      error: null,
    }),
}));

/** Whether the caller has blocked `memberId` (from the loaded list). */
export function isBlocked(
  state: Pick<ReportingState, 'blocks'>,
  memberId: string,
): boolean {
  return state.blocks.some((b) => b.blocked_id === memberId);
}
