import { create } from 'zustand';

import type { AppSupabaseClient } from '@/lib/supabase';

import {
  listOpenReports,
  listPendingMedia,
  listRecentActions,
  moderateMedia,
  moderatePost,
  reviewReport,
  type HistoryItem,
  type MediaAction,
  type PendingMediaItem,
  type PostAction,
  type QueueReport,
  type ReportAction,
} from './moderationService';

type LoadStatus = 'idle' | 'loading' | 'loaded' | 'error';

interface ModerationState {
  reports: QueueReport[];
  reportsStatus: LoadStatus;
  media: PendingMediaItem[];
  mediaStatus: LoadStatus;
  history: HistoryItem[];
  historyStatus: LoadStatus;
  /** A gentle, retryable error, or null when all is well. */
  error: string | null;
  /** True when the last error was the server declining the action. */
  notAuthorized: boolean;
  /** Id of the item a request is in flight for, to disable its controls. */
  pendingId: string | null;

  loadAll: (client: AppSupabaseClient) => Promise<void>;
  loadReports: (client: AppSupabaseClient) => Promise<void>;
  loadMedia: (client: AppSupabaseClient) => Promise<void>;
  loadHistory: (client: AppSupabaseClient) => Promise<void>;

  actOnPost: (
    client: AppSupabaseClient,
    postId: string,
    action: PostAction,
    reason?: string | null,
  ) => Promise<boolean>;
  actOnMedia: (
    client: AppSupabaseClient,
    mediaId: string,
    action: MediaAction,
    reason?: string | null,
  ) => Promise<boolean>;
  actOnReport: (
    client: AppSupabaseClient,
    reportId: string,
    action: ReportAction,
    reason?: string | null,
  ) => Promise<boolean>;

  clearError: () => void;
  clear: () => void;
}

export const useModerationStore = create<ModerationState>((set, get) => ({
  reports: [],
  reportsStatus: 'idle',
  media: [],
  mediaStatus: 'idle',
  history: [],
  historyStatus: 'idle',
  error: null,
  notAuthorized: false,
  pendingId: null,

  loadReports: async (client) => {
    set({ reportsStatus: 'loading', error: null });
    const result = await listOpenReports(client);
    if (result.ok) {
      set({ reports: result.value, reportsStatus: 'loaded' });
    } else {
      set({ reportsStatus: 'error', error: result.error });
    }
  },

  loadMedia: async (client) => {
    set({ mediaStatus: 'loading', error: null });
    const result = await listPendingMedia(client);
    if (result.ok) {
      set({ media: result.value, mediaStatus: 'loaded' });
    } else {
      set({ mediaStatus: 'error', error: result.error });
    }
  },

  loadHistory: async (client) => {
    set({ historyStatus: 'loading', error: null });
    const result = await listRecentActions(client);
    if (result.ok) {
      set({ history: result.value, historyStatus: 'loaded' });
    } else {
      set({ historyStatus: 'error', error: result.error });
    }
  },

  loadAll: async (client) => {
    await Promise.all([
      get().loadReports(client),
      get().loadMedia(client),
      get().loadHistory(client),
    ]);
  },

  actOnPost: async (client, postId, action, reason) => {
    set({ pendingId: postId, error: null, notAuthorized: false });
    const result = await moderatePost(client, postId, action, reason);
    set({ pendingId: null });
    if (!result.ok) {
      set({ error: result.error, notAuthorized: result.notAuthorized });
      return false;
    }
    // Refresh the queue and audit so the change and its history row show.
    await Promise.all([get().loadReports(client), get().loadHistory(client)]);
    return true;
  },

  actOnMedia: async (client, mediaId, action, reason) => {
    set({ pendingId: mediaId, error: null, notAuthorized: false });
    const result = await moderateMedia(client, mediaId, action, reason);
    set({ pendingId: null });
    if (!result.ok) {
      set({ error: result.error, notAuthorized: result.notAuthorized });
      return false;
    }
    await Promise.all([get().loadMedia(client), get().loadHistory(client)]);
    return true;
  },

  actOnReport: async (client, reportId, action, reason) => {
    set({ pendingId: reportId, error: null, notAuthorized: false });
    const result = await reviewReport(client, reportId, action, reason);
    set({ pendingId: null });
    if (!result.ok) {
      set({ error: result.error, notAuthorized: result.notAuthorized });
      return false;
    }
    await Promise.all([get().loadReports(client), get().loadHistory(client)]);
    return true;
  },

  clearError: () => set({ error: null, notAuthorized: false }),
  clear: () =>
    set({
      reports: [],
      reportsStatus: 'idle',
      media: [],
      mediaStatus: 'idle',
      history: [],
      historyStatus: 'idle',
      error: null,
      notAuthorized: false,
      pendingId: null,
    }),
}));
