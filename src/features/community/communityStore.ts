import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

import { communityCopy } from '@/content/community';
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
  /** Create a post (pending review); resolves to the created post, or null. */
  post: (
    client: AppSupabaseClient,
    body: string,
  ) => Promise<CommunityPost | null>;
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

/** Post ids with a support request in flight (module scope; not UI state). */
const supportInFlight = new Set<string>();

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
    if (!space) return null;
    const result = await createPost(client, { space, body });
    if (!result.ok) return null;
    const created = result.value;
    set((state) =>
      state.space === created.space
        ? { posts: [created, ...state.posts], status: 'loaded' }
        : {},
    );
    return created;
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
    // One request per post at a time: a second tap while one is in flight is
    // ignored, so the optimistic value and the server never disagree.
    if (supportInFlight.has(postId)) return false;
    supportInFlight.add(postId);

    const supported = get().mySupport[postId] === true;
    // Optimistic (issue #51): support is a reversible private yes/no, so it is
    // safe to show the new state immediately and roll back on failure.
    set((state) => ({
      actionError: null,
      mySupport: { ...state.mySupport, [postId]: !supported },
    }));

    try {
      const result = supported
        ? await removeSupport(client, postId)
        : await addSupport(client, postId);
      if (!result.ok) {
        // Roll back and surface the gentle, visible action error.
        set((state) => ({
          actionError: result.error,
          mySupport: { ...state.mySupport, [postId]: supported },
        }));
        return false;
      }
      return true;
    } catch {
      set((state) => ({
        actionError: communityCopy.actionErrorBody,
        mySupport: { ...state.mySupport, [postId]: supported },
      }));
      return false;
    } finally {
      supportInFlight.delete(postId);
    }
  },

  clearActionError: () => set({ actionError: null }),
  clear: () => {
    supportInFlight.clear();
    set({ ...initialState });
  },
}));
