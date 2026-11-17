import type { AppSupabaseClient } from '@/lib/supabase';
import * as reporting from '@/features/reporting';
import {
  SELF_BLOCK_ERROR,
  blockMember,
  listMyBlocks,
  listMyReports,
  reportPost,
  unblockMember,
  useReportingStore,
  type ReportReason,
} from '@/features/reporting';

function asClient(value: unknown) {
  return value as AppSupabaseClient;
}

const auth = {
  getUser: async () => ({ data: { user: { id: 'me' } }, error: null }),
};

describe('reportPost', () => {
  it('sends reporter_id from auth with a valid reason and trimmed details', async () => {
    const insert = jest.fn(async () => ({ error: null }));
    const from = jest.fn(() => ({ insert }));
    const result = await reportPost(asClient({ auth, from }), {
      postId: 'p1',
      reason: 'harassment',
      details: '  unkind replies  ',
    });

    expect(result).toEqual({ ok: true, value: 'reported' });
    expect(from).toHaveBeenCalledWith('post_reports');
    expect(insert).toHaveBeenCalledWith({
      post_id: 'p1',
      reporter_id: 'me',
      reason: 'harassment',
      details: 'unkind replies',
    });
  });

  it('treats a duplicate report as "already reported", not an error', async () => {
    const insert = jest.fn(async () => ({
      error: { code: '23505', message: 'duplicate key' },
    }));
    const result = await reportPost(
      asClient({ auth, from: () => ({ insert }) }),
      { postId: 'p1', reason: 'spam' },
    );
    expect(result).toEqual({ ok: true, value: 'already_reported' });
  });

  it('rejects an invalid reason and over-long details without calling the server', async () => {
    const from = jest.fn();
    const client = asClient({ auth, from });
    const bad = await reportPost(client, {
      postId: 'p1',
      reason: 'nope' as unknown as ReportReason,
    });
    expect(bad.ok).toBe(false);
    const long = await reportPost(client, {
      postId: 'p1',
      reason: 'other',
      details: 'x'.repeat(1001),
    });
    expect(long.ok).toBe(false);
    expect(from).not.toHaveBeenCalled();
  });

  it('returns a gentle error (never throws) on other failures', async () => {
    const insert = jest.fn(async () => ({ error: { code: '42501' } }));
    const result = await reportPost(
      asClient({ auth, from: () => ({ insert }) }),
      { postId: 'p1', reason: 'unsafe' },
    );
    expect(result.ok).toBe(false);
  });

  it('store surfaces already_reported as a non-error outcome', async () => {
    const insert = jest.fn(async () => ({ error: { code: '23505' } }));
    useReportingStore.getState().clear();
    const outcome = await useReportingStore
      .getState()
      .report(asClient({ auth, from: () => ({ insert }) }), {
        postId: 'p1',
        reason: 'spam',
      });
    expect(outcome).toBe('already_reported');
    expect(useReportingStore.getState().error).toBeNull();
  });
});

describe('listMyReports', () => {
  it('filters to the caller and never selects reporter_id', async () => {
    const order = jest.fn(async () => ({ data: [], error: null }));
    const eq = jest.fn(() => ({ order }));
    const select = jest.fn<{ eq: typeof eq }, [string]>(() => ({ eq }));
    const result = await listMyReports(
      asClient({ auth, from: () => ({ select }) }),
    );
    expect(result).toEqual({ ok: true, value: [] });
    expect(eq).toHaveBeenCalledWith('reporter_id', 'me');
    const columns = select.mock.calls[0]?.[0] as string | undefined;
    expect(columns).toBeDefined();
    expect(columns).not.toMatch(/reporter/);
  });
});

describe('blocking', () => {
  it('blocks a member with blocker_id from auth', async () => {
    const insert = jest.fn(async () => ({ error: null }));
    const from = jest.fn(() => ({ insert }));
    const result = await blockMember(asClient({ auth, from }), 'them');
    expect(result.ok).toBe(true);
    expect(from).toHaveBeenCalledWith('user_blocks');
    expect(insert).toHaveBeenCalledWith({
      blocker_id: 'me',
      blocked_id: 'them',
    });
  });

  it('refuses a self-block client-side', async () => {
    const from = jest.fn();
    const result = await blockMember(asClient({ auth, from }), 'me');
    expect(result).toEqual({ ok: false, error: SELF_BLOCK_ERROR });
    expect(from).not.toHaveBeenCalled();
  });

  it('treats an existing block as success', async () => {
    const insert = jest.fn(async () => ({ error: { code: '23505' } }));
    const result = await blockMember(
      asClient({ auth, from: () => ({ insert }) }),
      'them',
    );
    expect(result.ok).toBe(true);
  });

  it('unblocks only the caller-owned pair', async () => {
    const eq2 = jest.fn(async () => ({ error: null }));
    const eq1 = jest.fn(() => ({ eq: eq2 }));
    const del = jest.fn(() => ({ eq: eq1 }));
    const result = await unblockMember(
      asClient({ auth, from: () => ({ delete: del }) }),
      'them',
    );
    expect(result).toEqual({ ok: true, value: 'them' });
    expect(eq1).toHaveBeenCalledWith('blocker_id', 'me');
    expect(eq2).toHaveBeenCalledWith('blocked_id', 'them');
  });

  it('lists the caller blocks', async () => {
    const rows = [{ blocked_id: 'them', created_at: '2026-11-01T00:00:00Z' }];
    const order = jest.fn(async () => ({ data: rows, error: null }));
    const eq = jest.fn(() => ({ order }));
    const result = await listMyBlocks(
      asClient({ auth, from: () => ({ select: () => ({ eq }) }) }),
    );
    expect(result).toEqual({ ok: true, value: rows });
    expect(eq).toHaveBeenCalledWith('blocker_id', 'me');
  });

  it('store adds and removes blocks', async () => {
    useReportingStore.getState().clear();
    const client = asClient({
      auth,
      from: () => ({
        insert: async () => ({ error: null }),
        delete: () => ({ eq: () => ({ eq: async () => ({ error: null }) }) }),
      }),
    });
    expect(await useReportingStore.getState().block(client, 'them')).toBe(true);
    expect(reporting.isBlocked(useReportingStore.getState(), 'them')).toBe(
      true,
    );
    expect(await useReportingStore.getState().unblock(client, 'them')).toBe(
      true,
    );
    expect(reporting.isBlocked(useReportingStore.getState(), 'them')).toBe(
      false,
    );
  });
});

describe('no member-side status changes', () => {
  it('the barrel exposes no status-change / restore / moderation function', () => {
    const names = Object.keys(reporting);
    for (const name of names) {
      expect(name).not.toMatch(
        /^(set|update|change|edit|mark)|restore|approve|moderat|review|resolve|dismiss|unremove/i,
      );
    }
    for (const forbidden of [
      'updateReportStatus',
      'setReportStatus',
      'restorePost',
      'moderatePost',
      'reviewReport',
    ]) {
      expect(names).not.toContain(forbidden);
    }
    // Sanity: the member actions we do expose are present.
    expect(names).toEqual(expect.arrayContaining(['reportPost']));
  });

  it('the store exposes no status-change action', () => {
    const keys = Object.keys(useReportingStore.getState());
    for (const key of keys) {
      expect(key).not.toMatch(
        /restore|approve|moderat|review|resolve|dismiss/i,
      );
    }
  });
});
