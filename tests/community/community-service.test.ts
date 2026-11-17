import type { AppSupabaseClient } from '@/lib/supabase';
import {
  addSupport,
  checkIsPro,
  createPost,
  deletePost,
  listMySupport,
  listPosts,
  listReceivedSupport,
  removeSupport,
  validatePostBody,
} from '@/features/community';

import { filterValue, makeFakeClient } from './fakeClient';

function asClient(value: unknown) {
  return value as AppSupabaseClient;
}

describe('listPosts', () => {
  it('queries one space for approved + own pending posts, newest first', async () => {
    const rows = [{ id: 'p1' }];
    const { client, calls } = makeFakeClient({
      respond: () => ({ data: rows }),
    });

    const result = await listPosts(client, 'gentle_loss');

    const call = calls[0];
    expect(call?.table).toBe('community_posts');
    expect(filterValue(call, 'eq', 'space')).toBe('gentle_loss');
    expect(filterValue(call, 'in', 'status')).toEqual(['approved', 'pending']);
    expect(filterValue(call, 'order', 'created_at')).toEqual({
      ascending: false,
    });
    expect(result).toEqual({ ok: true, value: rows });
  });

  it('returns a gentle error on failure', async () => {
    const { client } = makeFakeClient({
      respond: () => ({ error: { message: 'boom' } }),
    });
    const result = await listPosts(client, 'recovery');
    expect(result.ok).toBe(false);
  });
});

describe('createPost', () => {
  it('sends status pending, the space, and the author from auth', async () => {
    const single = jest
      .fn()
      .mockResolvedValue({ data: { id: 'p1' }, error: null });
    const insert = jest.fn().mockReturnValue({ select: () => ({ single }) });
    const client = asClient({
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: 'author-1' } },
          error: null,
        }),
      },
      from: jest.fn().mockReturnValue({ insert }),
    });

    const result = await createPost(client, {
      space: 'recovery',
      body: '  A hard night, but we made it.  ',
    });

    expect(insert).toHaveBeenCalledWith({
      author_id: 'author-1',
      body: 'A hard night, but we made it.',
      space: 'recovery',
      status: 'pending',
    });
    expect(result).toEqual({ ok: true, value: { id: 'p1' } });
  });

  it('rejects an empty or over-long body without calling the backend', async () => {
    const from = jest.fn();
    const client = asClient({ auth: { getUser: jest.fn() }, from });

    expect(
      (await createPost(client, { space: 'recovery', body: '   ' })).ok,
    ).toBe(false);
    expect(
      (await createPost(client, { space: 'recovery', body: 'a'.repeat(5001) }))
        .ok,
    ).toBe(false);
    expect(from).not.toHaveBeenCalled();
  });

  it('accepts the 1 and 5000 character bounds', () => {
    expect(validatePostBody('a')).toBeNull();
    expect(validatePostBody('a'.repeat(5000))).toBeNull();
  });

  it('surfaces a gentle error when the insert fails', async () => {
    const { client } = makeFakeClient({
      respond: () => ({ error: { message: 'not pro' } }),
    });
    const result = await createPost(client, { space: 'recovery', body: 'hi' });
    expect(result.ok).toBe(false);
  });
});

describe('deletePost', () => {
  it('deletes by id', async () => {
    const eq = jest.fn().mockResolvedValue({ error: null });
    const del = jest.fn().mockReturnValue({ eq });
    const from = jest.fn().mockReturnValue({ delete: del });

    const result = await deletePost(asClient({ from }), 'p1');

    expect(from).toHaveBeenCalledWith('community_posts');
    expect(eq).toHaveBeenCalledWith('id', 'p1');
    expect(result).toEqual({ ok: true, value: 'p1' });
  });

  it('surfaces a gentle error on failure', async () => {
    const eq = jest.fn().mockResolvedValue({ error: { message: 'no' } });
    const result = await deletePost(
      asClient({ from: () => ({ delete: () => ({ eq }) }) }),
      'p1',
    );
    expect(result.ok).toBe(false);
  });
});

describe('support', () => {
  it('addSupport inserts a support reaction for the caller', async () => {
    const { client, calls } = makeFakeClient({
      userId: 'u9',
      respond: () => ({}),
    });

    const result = await addSupport(client, 'p1');

    expect(calls[0]?.table).toBe('post_reactions');
    expect(calls[0]?.op).toBe('insert');
    expect(calls[0]?.payload).toEqual({
      post_id: 'p1',
      user_id: 'u9',
      reaction: 'support',
    });
    expect(result).toEqual({ ok: true, value: 'p1' });
  });

  it('addSupport treats an existing support as success', async () => {
    const { client } = makeFakeClient({
      respond: () => ({ error: { message: 'dup', code: '23505' } }),
    });
    expect((await addSupport(client, 'p1')).ok).toBe(true);
  });

  it('addSupport surfaces other failures gently', async () => {
    const { client } = makeFakeClient({
      respond: () => ({ error: { message: 'not pro', code: '42501' } }),
    });
    expect((await addSupport(client, 'p1')).ok).toBe(false);
  });

  it("removeSupport deletes only the caller's own reaction", async () => {
    const { client, calls } = makeFakeClient({
      userId: 'u9',
      respond: () => ({}),
    });

    const result = await removeSupport(client, 'p1');

    const call = calls[0];
    expect(call?.op).toBe('delete');
    expect(filterValue(call, 'eq', 'post_id')).toBe('p1');
    expect(filterValue(call, 'eq', 'user_id')).toBe('u9');
    expect(result).toEqual({ ok: true, value: 'p1' });
  });

  it('listMySupport returns a boolean for every post (never counts)', async () => {
    const { client, calls } = makeFakeClient({
      userId: 'u9',
      respond: () => ({ data: [{ post_id: 'p1' }, { post_id: 'p1' }] }),
    });

    const result = await listMySupport(client, ['p1', 'p2']);

    expect(filterValue(calls[0], 'eq', 'user_id')).toBe('u9');
    expect(filterValue(calls[0], 'in', 'post_id')).toEqual(['p1', 'p2']);
    expect(result).toEqual({ ok: true, value: { p1: true, p2: false } });
    if (result.ok) {
      for (const value of Object.values(result.value)) {
        expect(typeof value).toBe('boolean');
      }
    }
  });

  it('listMySupport skips the backend for an empty list', async () => {
    const { client, calls } = makeFakeClient();
    expect(await listMySupport(client, [])).toEqual({ ok: true, value: {} });
    expect(calls).toHaveLength(0);
  });

  it('listReceivedSupport says yes/no per own post, excluding the author', async () => {
    const { client, calls } = makeFakeClient({
      userId: 'u1',
      respond: () => ({
        data: [{ post_id: 'own1' }, { post_id: 'own1' }, { post_id: 'own1' }],
      }),
    });

    const result = await listReceivedSupport(client, ['own1', 'own2']);

    expect(filterValue(calls[0], 'neq', 'user_id')).toBe('u1');
    expect(result).toEqual({ ok: true, value: { own1: true, own2: false } });
  });
});

describe('checkIsPro', () => {
  it('reads the is_pro RPC', async () => {
    const rpc = jest.fn().mockResolvedValue({ data: true, error: null });
    const result = await checkIsPro(asClient({ rpc }));
    expect(rpc).toHaveBeenCalledWith('is_pro');
    expect(result).toEqual({ ok: true, value: true });
  });

  it('reports an error rather than guessing Pro', async () => {
    const rpc = jest
      .fn()
      .mockResolvedValue({ data: null, error: { message: 'x' } });
    expect((await checkIsPro(asClient({ rpc }))).ok).toBe(false);
  });
});
