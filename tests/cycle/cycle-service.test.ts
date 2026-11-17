import type { AppSupabaseClient } from '@/lib/supabase';
import {
  addCycleStart,
  deleteAllCycleHistory,
  deleteCycleStart,
  listCycleStarts,
} from '@/features/cycle';

function asClient(value: unknown) {
  return value as AppSupabaseClient;
}

/** A getUser mock that returns a signed-in user. */
function authWithUser(id = 'u1') {
  return {
    getUser: jest
      .fn()
      .mockResolvedValue({ data: { user: { id } }, error: null }),
  };
}

describe('addCycleStart', () => {
  it('inserts the caller id and start date, returning the row', async () => {
    const single = jest.fn().mockResolvedValue({
      data: { id: 'c1', started_on: '2026-11-01' },
      error: null,
    });
    const select = jest.fn().mockReturnValue({ single });
    const insert = jest.fn().mockReturnValue({ select });
    const client = asClient({
      auth: authWithUser('u1'),
      from: jest.fn().mockReturnValue({ insert }),
    });

    const result = await addCycleStart(client, '2026-11-01');

    expect(insert).toHaveBeenCalledWith({
      user_id: 'u1',
      started_on: '2026-11-01',
    });
    expect(result).toEqual({
      ok: true,
      value: { id: 'c1', started_on: '2026-11-01' },
    });
  });

  it('rejects a malformed date without calling the backend', async () => {
    const from = jest.fn();
    const client = asClient({ auth: authWithUser(), from });

    const result = await addCycleStart(client, '2026-13-40');
    expect(result.ok).toBe(false);
    expect(from).not.toHaveBeenCalled();
  });

  it('surfaces a gentle error when the insert fails (does not throw)', async () => {
    const single = jest
      .fn()
      .mockResolvedValue({ data: null, error: { message: 'duplicate' } });
    const client = asClient({
      auth: authWithUser(),
      from: () => ({ insert: () => ({ select: () => ({ single }) }) }),
    });

    const result = await addCycleStart(client, '2026-11-01');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toMatch(/could not save/i);
    }
  });

  it('fails gently when there is no signed-in user', async () => {
    const from = jest.fn();
    const client = asClient({
      auth: {
        getUser: jest
          .fn()
          .mockResolvedValue({ data: { user: null }, error: null }),
      },
      from,
    });
    const result = await addCycleStart(client, '2026-11-01');
    expect(result.ok).toBe(false);
    expect(from).not.toHaveBeenCalled();
  });
});

describe('listCycleStarts', () => {
  it('orders by started_on descending and returns rows', async () => {
    const rows = [{ id: 'c2' }, { id: 'c1' }];
    const order = jest.fn().mockResolvedValue({ data: rows, error: null });
    const select = jest.fn().mockReturnValue({ order });
    const client = asClient({ from: () => ({ select }) });

    const result = await listCycleStarts(client);

    expect(order).toHaveBeenCalledWith('started_on', { ascending: false });
    expect(result).toEqual({ ok: true, value: rows });
  });

  it('reports a retryable error on failure', async () => {
    const order = jest
      .fn()
      .mockResolvedValue({ data: null, error: { message: 'boom' } });
    const client = asClient({ from: () => ({ select: () => ({ order }) }) });
    const result = await listCycleStarts(client);
    expect(result.ok).toBe(false);
  });
});

describe('deleteCycleStart', () => {
  it('deletes the row by id and returns ok', async () => {
    const eq = jest.fn().mockResolvedValue({ error: null });
    const del = jest.fn().mockReturnValue({ eq });
    const client = asClient({ from: () => ({ delete: del }) });

    const result = await deleteCycleStart(client, 'c1');
    expect(eq).toHaveBeenCalledWith('id', 'c1');
    expect(result).toEqual({ ok: true, value: 'c1' });
  });

  it('surfaces a gentle error when deletion fails', async () => {
    const eq = jest.fn().mockResolvedValue({ error: { message: 'nope' } });
    const client = asClient({ from: () => ({ delete: () => ({ eq }) }) });
    const result = await deleteCycleStart(client, 'c1');
    expect(result.ok).toBe(false);
  });
});

describe('deleteAllCycleHistory', () => {
  it('deletes every row scoped to the caller id', async () => {
    const eq = jest.fn().mockResolvedValue({ error: null });
    const del = jest.fn().mockReturnValue({ eq });
    const client = asClient({
      auth: authWithUser('u1'),
      from: jest.fn().mockReturnValue({ delete: del }),
    });

    const result = await deleteAllCycleHistory(client);

    expect(eq).toHaveBeenCalledWith('user_id', 'u1');
    expect(result).toEqual({ ok: true, value: true });
  });

  it('surfaces a gentle error when the bulk delete fails', async () => {
    const eq = jest.fn().mockResolvedValue({ error: { message: 'nope' } });
    const client = asClient({
      auth: authWithUser('u1'),
      from: () => ({ delete: () => ({ eq }) }),
    });
    const result = await deleteAllCycleHistory(client);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toMatch(/could not clear/i);
    }
  });

  it('does not touch the backend without a signed-in user', async () => {
    const from = jest.fn();
    const client = asClient({
      auth: {
        getUser: jest
          .fn()
          .mockResolvedValue({ data: { user: null }, error: null }),
      },
      from,
    });
    const result = await deleteAllCycleHistory(client);
    expect(result.ok).toBe(false);
    expect(from).not.toHaveBeenCalled();
  });
});
