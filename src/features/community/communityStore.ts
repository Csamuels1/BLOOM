import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

import type { AppSupabaseClient } from '@/lib/supabase';

import {
  addSupport,
  checkIsPro,
  createPost,
  deletePost,
  getViewerId,
  isCommunitySpace,
  listMySupport,
  listPosts,
  listReceivedSupport,
  removeSupport,
  type CommunityPost,
  type CommunitySpace,
  type SupportMap,
} from './communityService';

type CommunityStatus = 'idle' | 'loading' | 'loaded' | 'error';

/** Storage key prefix; the viewer's id is appended so choices stay per person. */
export const COMMUNITY_SPACE_STORAGE_KEY = 'bloom-community-space';

export function spaceStorageKey(viewerId: string | null): string {
  return `${COMMUNITY_SPACE_STORAGE_KEY}:${viewerId ?? 'anonymous'}`;
}

async function readStoredSpace(
  viewerId: string | null,
): Promise<CommunitySpace | null> {
  try {
    const value = await AsyncStorage.getItem(spaceStorageKey(viewerId));
    return isCommunitySpace(value) ? value : null;
  } catch {
    // Storage can be empty or unavailable; the chooser simply asks again.
    return null;
  }
}

async function writeStoredSpace(
  viewerId: string | null,
  space: CommunitySpace,
): Promise<void> {
  try {
    await AsyncStorage.setItem(spaceStorageKey(viewerId), space);
  } catch {
    // Non-critical convenience: the in-memory choice still applies.
  }
}

interface CommunityState {
  viewerId: string | null;
  /** The chosen space, or null until the viewer picks one. */
  space: CommunitySpace | null;
  /** True once the viewer, stored space, and Pro status have been resolved. */
  ready: boolean;
  posts: CommunityPost[];
  /** Posts the viewer has supported (yes/no, never counts). */
  mySupport: SupportMap;
  /** The viewer's own posts that someone is with (yes/no, never counts). */
  receivedSupport: SupportMap;
  isPro: boolean;
  status: CommunityStatus;
  /** A gentle, retryable feed-load error, or null. */
  error: string | null;
  /** A gentle error from delete/support, or null. */
  actionError: string | null;

  /** Resolve viewer, restore their space choice, check Pro, then load. */
  init: (client: AppSupabaseClient) => Promise<void>;
  /** Choose a space: persists the choice and loads that space's feed. */
  chooseSpace: (
    client: AppSupabaseClient,
    space: CommunitySpace,
  ) => Promise<void>;
  /** (Re)load the current space's feed. Safe to call again to retry. */
  load: (client: AppSupabaseClient) => Promise<void>;
  /** Share a post in the current space; resolves true on success. */
  post: (client: AppSupabaseClient, body: string) => Promise<boolean>;
  /** Delete one of the viewer's posts; resolves true on success. */
  remove: (client: AppSupabaseClient, id: string) => Promise<boolean>;
  /** Toggle the viewer's quiet support on a post; resolves true on success. */
  toggleSupport: (
    client: AppSupabaseClient,
    postId: string,
  ) => Promise<boolean>;
  clearActionError: () => void;
  /** Reset on sign-out. */
  clear: () => void;
}

const initialState = {
  viewerId: null,
  space: null,
  ready: false,
  posts: [],
  mySupport: {},
  receivedSupport: {},
  isPro: false,
  status: 'idle' as CommunityStatus,
  error: null,
  actionError: null,
};

export const useCommunityStore = create<CommunityState>((set, get) => ({
  ...initialState,

  init: async (client) => {
    const viewerId = await getViewerId(client);
    const [space, pro] = await Promise.all([
      readStoredSpace(viewerId),
      checkIsPro(client),
    ]);
    // If Pro cannot be checked, fall back to the free view (reads still work).
    set({ viewerId, space, isPro: pro.ok ? pro.value : false, ready: true });
    if (space) {
      await get().load(client);
    }
  },

  chooseSpace: async (client, space) => {
    set({ space, posts: [], mySupport: {}, receivedSupport: {} });
    await writeStoredSpace(get().viewerId, space);
    await get().load(client);
  },

  load: async (client) => {
    const space = get().space;
    if (!space) return;
    set({ status: 'loading', error: null });
    const result = await listPosts(client, space);
    // Ignore a stale response if the viewer switched spaces meanwhile.
    if (get().space !== space) return;
    if (!result.ok) {
      set({ status: 'error', error: result.error });
      return;
    }

    const posts = result.value;
    const viewerId = get().viewerId;
    const othersApproved = posts
      .filter((p) => p.author_id !== viewerId && p.status === 'approved')
      .map((p) => p.id);
    const ownApproved = posts
      .filter((p) => p.author_id === viewerId && p.status === 'approved')
      .map((p) => p.id);

    const [mine, received] = await Promise.all([
      listMySupport(client, othersApproved),
      listReceivedSupport(client, ownApproved),
    ]);
    if (get().space !== space) return;

    set({
      posts,
      // Support signals are a gentle extra; the feed still shows without them.
      mySupport: mine.ok ? mine.value : {},
      receivedSupport: received.ok ? received.value : {},
      status: 'loaded',
      error: null,
    });
  },

  post: async (client, body) => {
    const space = get().space;
    if (!space) return false;
    const result = await createPost(client, { space, body });
    if (!result.ok) return false;
    const created = result.value;
    set((state) =>
      state.space === created.space
        ? { posts: [created, ...state.posts], status: 'loaded' }
        : {},
    );
    return true;
  },

  remove: async (client, id) => {
    set({ actionError: null });
    const result = await deletePost(client, id);
    if (!result.ok) {
      set({ actionError: result.error });
      return false;
    }
    set((state) => ({ posts: state.posts.filter((p) => p.id !== id) }));
    return true;
  },

  toggleSupport: async (client, postId) => {
    set({ actionError: null });
    const supported = get().mySupport[postId] === true;
    const result = supported
      ? await removeSupport(client, postId)
      : await addSupport(client, postId);
    if (!result.ok) {
      set({ actionError: result.error });
      return false;
    }
    set((state) => ({
      mySupport: { ...state.mySupport, [postId]: !supported },
    }));
    return true;
  },

  clearActionError: () => set({ actionError: null }),
  clear: () => set({ ...initialState }),
}));
