import type { AppSupabaseClient } from '@/lib/supabase';
import {
  deleteAccount,
  exportAccount,
  loadProfile,
  persistOnboarding,
} from '@/features/profile';

function asClient(value: unknown) {
  return value as AppSupabaseClient;
}

describe('persistOnboarding', () => {
  it('calls the persist RPC with the mapped payload and returns the profile', async () => {
    const rpc = jest
      .fn()
      .mockResolvedValue({ data: { id: 'u1', goal: 'loss' }, error: null });
    const result = await persistOnboarding(asClient({ rpc }), { goal: 'loss' });

    expect(rpc).toHaveBeenCalledWith('persist_onboarding', {
      p: expect.objectContaining({ goal: 'loss', age_confirmed: true }),
    });
    expect(result).toEqual({ ok: true, profile: { id: 'u1', goal: 'loss' } });
  });

  it('reports a neutral error on failure', async () => {
    const rpc = jest
      .fn()
      .mockResolvedValue({ data: null, error: { message: 'boom' } });
    const result = await persistOnboarding(asClient({ rpc }), { goal: 'loss' });
    expect(result.ok).toBe(false);
  });
});

describe('loadProfile', () => {
  it('returns the single own profile row', async () => {
    const maybeSingle = jest
      .fn()
      .mockResolvedValue({ data: { id: 'u1' }, error: null });
    const client = asClient({
      from: () => ({ select: () => ({ maybeSingle }) }),
    });
    expect(await loadProfile(client)).toEqual({ id: 'u1' });
  });
});

describe('exportAccount', () => {
  it('returns the export document', async () => {
    const rpc = jest
      .fn()
      .mockResolvedValue({ data: { profile: { id: 'u1' } }, error: null });
    expect(await exportAccount(asClient({ rpc }))).toEqual({
      profile: { id: 'u1' },
    });
    expect(rpc).toHaveBeenCalledWith('export_current_user');
  });
});

describe('deleteAccount', () => {
  it('cleans up Storage, deletes the account, then signs out', async () => {
    const remove = jest.fn().mockResolvedValue({ data: [], error: null });
    const list = jest
      .fn()
      .mockResolvedValue({ data: [{ name: 'a.jpg' }], error: null });
    const rpc = jest.fn().mockResolvedValue({ data: null, error: null });
    const signOut = jest.fn().mockResolvedValue({ error: null });
    const client = asClient({
      storage: { from: () => ({ list, remove }) },
      rpc,
      auth: { signOut },
    });

    const result = await deleteAccount(client, 'u1');

    expect(list).toHaveBeenCalledWith('u1');
    expect(remove).toHaveBeenCalledWith(['u1/a.jpg']);
    expect(rpc).toHaveBeenCalledWith('delete_current_user');
    expect(signOut).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ ok: true });
  });

  it('does not sign out when deletion fails', async () => {
    const rpc = jest
      .fn()
      .mockResolvedValue({ data: null, error: { message: 'nope' } });
    const signOut = jest.fn();
    const client = asClient({
      storage: {
        from: () => ({
          list: jest.fn().mockResolvedValue({ data: [] }),
          remove: jest.fn(),
        }),
      },
      rpc,
      auth: { signOut },
    });

    const result = await deleteAccount(client, 'u1');
    expect(result.ok).toBe(false);
    expect(signOut).not.toHaveBeenCalled();
  });
});
