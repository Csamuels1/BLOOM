import type { AppSupabaseClient } from '@/lib/supabase';
import {
  deleteWeight,
  listWeights,
  logWeight,
  updateWeight,
} from '@/features/weight';

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

describe('logWeight', () => {
  it('inserts the caller id and canonical kg, returning the row', async () => {
    const single = jest
      .fn()
      .mockResolvedValue({ data: { id: 'w1', weight_kg: 68 }, error: null });
    const select = jest.fn().mockReturnValue({ single });
    const insert = jest.fn().mockReturnValue({ select });
    const client = asClient({
      auth: authWithUser('u1'),
      from: jest.fn().mockReturnValue({ insert }),
    });

    const result = await logWeight(client, {
      weightKg: 68,
      measuredAt: '2026-11-12',
      note: 'after a walk',
    });

    expect(insert).toHaveBeenCalledWith({
      user_id: 'u1',
      weight_kg: 68,
      measured_at: '2026-11-12',
      note: 'after a walk',
    });
    expect(result).toEqual({ ok: true, value: { id: 'w1', weight_kg: 68 } });
  });

  it('defaults measured_at to today and note to null', async () => {
    const single = jest
      .fn()
      .mockResolvedValue({ data: { id: 'w1' }, error: null });
    const insert = jest.fn().mockReturnValue({ select: () => ({ single }) });
    const client = asClient({
      auth: authWithUser(),
      from: () => ({ insert }),
    });

    await logWeight(client, { weightKg: 70 });

    const payload = insert.mock.calls[0]?.[0];
    expect(payload).toMatchObject({ weight_kg: 70, note: null });
    expect(payload.measured_at).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('rejects an out-of-range weight without calling the backend', async () => {
    const from = jest.fn();
    const client = asClient({ auth: authWithUser(), from });

    const result = await logWeight(client, { weightKg: 500 });
    expect(result.ok).toBe(false);
    expect(from).not.toHaveBeenCalled();
  });

  it('surfaces a gentle error when the insert fails (does not throw)', async () => {
    const single = jest
      .fn()
      .mockResolvedValue({ data: null, error: { message: 'offline' } });
    const client = asClient({
      auth: authWithUser(),
      from: () => ({ insert: () => ({ select: () => ({ single }) }) }),
    });

    const result = await logWeight(client, { weightKg: 68 });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toMatch(/could not save/i);
    }
  });
});

describe('listWeights', () => {
  it('orders by measured_at then created_at descending and returns rows', async () => {
    const rows = [{ id: 'w2' }, { id: 'w1' }];
    const secondOrder = jest
      .fn()
      .mockResolvedValue({ data: rows, error: null });
    const firstOrder = jest.fn().mockReturnValue({ order: secondOrder });
    const select = jest.fn().mockReturnValue({ order: firstOrder });
    const client = asClient({ from: () => ({ select }) });

    const result = await listWeights(client);

    expect(firstOrder).toHaveBeenCalledWith('measured_at', {
      ascending: false,
    });
    expect(secondOrder).toHaveBeenCalledWith('created_at', {
      ascending: false,
    });
    expect(result).toEqual({ ok: true, value: rows });
  });

  it('reports a retryable error on failure', async () => {
    const secondOrder = jest
      .fn()
      .mockResolvedValue({ data: null, error: { message: 'boom' } });
    const client = asClient({
      from: () => ({
        select: () => ({ order: () => ({ order: secondOrder }) }),
      }),
    });
    const result = await listWeights(client);
    expect(result.ok).toBe(false);
  });
});

describe('updateWeight', () => {
  it('applies only provided fields and returns the updated row', async () => {
    const single = jest
      .fn()
      .mockResolvedValue({ data: { id: 'w1', weight_kg: 69 }, error: null });
    const select = jest.fn().mockReturnValue({ single });
    const eq = jest.fn().mockReturnValue({ select });
    const update = jest.fn().mockReturnValue({ eq });
    const client = asClient({ from: () => ({ update }) });

    const result = await updateWeight(client, 'w1', { weightKg: 69 });

    expect(update).toHaveBeenCalledWith({ weight_kg: 69 });
    expect(eq).toHaveBeenCalledWith('id', 'w1');
    expect(result).toEqual({ ok: true, value: { id: 'w1', weight_kg: 69 } });
  });

  it('rejects an invalid weight before touching the backend', async () => {
    const from = jest.fn();
    const result = await updateWeight(asClient({ from }), 'w1', {
      weightKg: -1,
    });
    expect(result.ok).toBe(false);
    expect(from).not.toHaveBeenCalled();
  });

  it('surfaces a gentle error when the update fails', async () => {
    const single = jest
      .fn()
      .mockResolvedValue({ data: null, error: { message: 'nope' } });
    const client = asClient({
      from: () => ({
        update: () => ({ eq: () => ({ select: () => ({ single }) }) }),
      }),
    });
    const result = await updateWeight(client, 'w1', { note: 'x' });
    expect(result.ok).toBe(false);
  });
});

describe('deleteWeight', () => {
  it('deletes the row by id and returns ok', async () => {
    const eq = jest.fn().mockResolvedValue({ error: null });
    const del = jest.fn().mockReturnValue({ eq });
    const client = asClient({ from: () => ({ delete: del }) });

    const result = await deleteWeight(client, 'w1');
    expect(eq).toHaveBeenCalledWith('id', 'w1');
    expect(result).toEqual({ ok: true, value: 'w1' });
  });

  it('surfaces a gentle error when deletion fails', async () => {
    const eq = jest.fn().mockResolvedValue({ error: { message: 'nope' } });
    const client = asClient({ from: () => ({ delete: () => ({ eq }) }) });
    const result = await deleteWeight(client, 'w1');
    expect(result.ok).toBe(false);
  });
});
