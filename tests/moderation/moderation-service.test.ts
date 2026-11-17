import type { Session } from '@supabase/supabase-js';

import type { AppSupabaseClient } from '@/lib/supabase';
import {
  isModeratorSession,
  listOpenReports,
  listPendingMedia,
  listRecentActions,
  moderateMedia,
  moderatePost,
  reviewReport,
} from '@/features/moderation/moderationService';
import { useModerationStore } from '@/features/moderation/moderationStore';

function asClient(value: unknown) {
  return value as AppSupabaseClient;
}

/** A chainable, awaitable query builder whose terminal await yields `result`. */
function builder(result: unknown) {
  const b: Record<string, unknown> = {};
  for (const method of ['select', 'in', 'eq', 'order', 'limit']) {
    b[method] = jest.fn(() => b);
  }
  b.then = (
    resolve: (v: unknown) => unknown,
    reject: (e: unknown) => unknown,
  ) => Promise.resolve(result).then(resolve, reject);
  return b;
}

function session(role?: string): Session {
  return {
    access_token: 't',
    token_type: 'bearer',
    user: { app_metadata: role ? { role } : {} },
  } as unknown as Session;
}

describe('isModeratorSession', () => {
  it('is true only for a moderator/admin role claim', () => {
    expect(isModeratorSession(session('moderator'))).toBe(true);
    expect(isModeratorSession(session('admin'))).toBe(true);
    expect(isModeratorSession(session('user'))).toBe(false);
    expect(isModeratorSession(session())).toBe(false);
    expect(isModeratorSession(null)).toBe(false);
  });
});

describe('listOpenReports', () => {
  it('requests only open/reviewing reports joined to the post, newest-queued first', async () => {
    const row = {
      id: 'r1',
      post_id: 'p1',
      reason: 'harassment',
      details: 'note',
      status: 'open',
      created_at: '2026-11-17T00:00:00Z',
      community_posts: { body: 'a post', status: 'approved', author_id: 'u1' },
    };
    const b = builder({ data: [row], error: null });
    const from = jest.fn(() => b);
    const result = await listOpenReports(asClient({ from }));

    expect(from).toHaveBeenCalledWith('post_reports');
    expect(b.in).toHaveBeenCalledWith('status', ['open', 'reviewing']);
    expect(result).toEqual({
      ok: true,
      value: [
        {
          id: 'r1',
          postId: 'p1',
          reason: 'harassment',
          details: 'note',
          status: 'open',
          createdAt: '2026-11-17T00:00:00Z',
          postBody: 'a post',
          postStatus: 'approved',
          postAuthorId: 'u1',
        },
      ],
    });
  });

  it('returns a gentle error (never throws) when the read fails', async () => {
    const from = jest.fn(() =>
      builder({ data: null, error: { code: '42501' } }),
    );
    const result = await listOpenReports(asClient({ from }));
    expect(result.ok).toBe(false);
  });
});

describe('listPendingMedia', () => {
  it('lists pending media with a signed preview url', async () => {
    const row = {
      id: 'm1',
      post_id: 'p1',
      author_id: 'u1',
      mime_type: 'image/jpeg',
      size_bytes: 1000,
      created_at: '2026-11-17T00:00:00Z',
      storage_path: 'u1/m1.jpg',
      community_posts: { body: 'with image', status: 'pending' },
    };
    const createSignedUrl = jest.fn(async () => ({
      data: { signedUrl: 'https://signed/u1/m1.jpg' },
      error: null,
    }));
    const client = asClient({
      from: () => builder({ data: [row], error: null }),
      storage: { from: () => ({ createSignedUrl }) },
    });
    const result = await listPendingMedia(client);

    expect(createSignedUrl).toHaveBeenCalledWith('u1/m1.jpg', 300);
    expect(result).toEqual({
      ok: true,
      value: [
        {
          id: 'm1',
          postId: 'p1',
          authorId: 'u1',
          mimeType: 'image/jpeg',
          sizeBytes: 1000,
          createdAt: '2026-11-17T00:00:00Z',
          postBody: 'with image',
          postStatus: 'pending',
          previewUrl: 'https://signed/u1/m1.jpg',
        },
      ],
    });
  });

  it('keeps a null preview when a signed url cannot be made', async () => {
    const row = {
      id: 'm1',
      post_id: 'p1',
      author_id: 'u1',
      mime_type: 'image/png',
      size_bytes: 1,
      created_at: '2026-11-17T00:00:00Z',
      storage_path: 'u1/m1.png',
      community_posts: { body: '', status: 'pending' },
    };
    const client = asClient({
      from: () => builder({ data: [row], error: null }),
      storage: {
        from: () => ({
          createSignedUrl: async () => ({
            data: null,
            error: { message: 'no' },
          }),
        }),
      },
    });
    const result = await listPendingMedia(client);
    expect(result.ok && result.value[0]?.previewUrl).toBeNull();
  });
});

describe('listRecentActions', () => {
  it('maps audit rows newest first', async () => {
    const b = builder({
      data: [
        {
          id: 'a1',
          moderator_id: 'c1',
          action: 'remove',
          target_type: 'post',
          target_id: 'p1',
          reason: null,
          created_at: '2026-11-17T01:00:00Z',
        },
      ],
      error: null,
    });
    const result = await listRecentActions(asClient({ from: () => b }));
    expect(b.order).toHaveBeenCalledWith('created_at', { ascending: false });
    expect(result).toEqual({
      ok: true,
      value: [
        {
          id: 'a1',
          moderatorId: 'c1',
          action: 'remove',
          targetType: 'post',
          targetId: 'p1',
          reason: null,
          createdAt: '2026-11-17T01:00:00Z',
        },
      ],
    });
  });
});

describe('moderation action RPCs', () => {
  it('moderatePost calls moderate_post with a trimmed note and returns the status', async () => {
    const rpc = jest.fn(async () => ({ data: 'removed', error: null }));
    const result = await moderatePost(
      asClient({ rpc }),
      'p1',
      'remove',
      '  spam  ',
    );
    expect(rpc).toHaveBeenCalledWith('moderate_post', {
      p_post_id: 'p1',
      p_action: 'remove',
      p_reason: 'spam',
    });
    expect(result).toEqual({ ok: true, value: 'removed' });
  });

  it('omits an empty note (undefined, not an empty string)', async () => {
    const rpc = jest.fn(async () => ({ data: 'approved', error: null }));
    await moderateMedia(asClient({ rpc }), 'm1', 'approve', '   ');
    expect(rpc).toHaveBeenCalledWith('moderate_media', {
      p_media_id: 'm1',
      p_action: 'approve',
      p_reason: undefined,
    });
  });

  it('maps a 42501 denial to a not-authorized result, never throwing', async () => {
    const rpc = jest.fn(async () => ({
      data: null,
      error: { code: '42501', message: 'not authorized' },
    }));
    const result = await reviewReport(
      asClient({ rpc }),
      'r1',
      'resolve_report',
    );
    expect(result).toEqual({
      ok: false,
      error: 'The server declined that action for this account.',
      notAuthorized: true,
    });
  });

  it('maps other errors to a generic, non-authorization result', async () => {
    const rpc = jest.fn(async () => ({
      data: null,
      error: { code: 'P0002', message: 'post not found' },
    }));
    const result = await moderatePost(asClient({ rpc }), 'gone', 'approve');
    expect(result).toEqual({
      ok: false,
      error: 'That action did not go through.',
      notAuthorized: false,
    });
  });
});

describe('useModerationStore', () => {
  beforeEach(() => {
    useModerationStore.getState().clear();
  });

  it('refreshes reports and history after a successful post action', async () => {
    const rpc = jest.fn(async () => ({ data: 'removed', error: null }));
    const from = jest.fn(() => builder({ data: [], error: null }));
    const ok = await useModerationStore
      .getState()
      .actOnPost(asClient({ rpc, from }), 'p1', 'remove');
    expect(ok).toBe(true);
    expect(from).toHaveBeenCalledWith('post_reports');
    expect(from).toHaveBeenCalledWith('moderation_actions');
    expect(useModerationStore.getState().pendingId).toBeNull();
    expect(useModerationStore.getState().error).toBeNull();
  });

  it('surfaces a server denial as an error without refreshing', async () => {
    const rpc = jest.fn(async () => ({ data: null, error: { code: '42501' } }));
    const from = jest.fn(() => builder({ data: [], error: null }));
    const ok = await useModerationStore
      .getState()
      .actOnReport(asClient({ rpc, from }), 'r1', 'dismiss_report');
    expect(ok).toBe(false);
    expect(from).not.toHaveBeenCalled();
    expect(useModerationStore.getState().notAuthorized).toBe(true);
    expect(useModerationStore.getState().error).not.toBeNull();
  });
});
