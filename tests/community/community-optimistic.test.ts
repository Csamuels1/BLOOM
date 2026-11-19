import {
  addSupport,
  removeSupport,
} from '@/features/community/communityService';
import { useCommunityStore } from '@/features/community/communityStore';
import type { AppSupabaseClient } from '@/lib/supabase';

jest.mock('@/features/community/communityService', () => ({
  ...jest.requireActual('@/features/community/communityService'),
  addSupport: jest.fn(),
  removeSupport: jest.fn(),
}));

const add = addSupport as jest.Mock;
const remove = removeSupport as jest.Mock;
const client = {} as AppSupabaseClient;

type Outcome = { ok: true; value: string } | { ok: false; error: string };

/** A promise we resolve by hand, to observe the optimistic in-between state. */
function deferred() {
  let resolve: (value: Outcome) => void = () => undefined;
  const promise = new Promise<Outcome>((r) => {
    resolve = r;
  });
  return { promise, resolve };
}

beforeEach(() => {
  useCommunityStore.getState().clear();
});

describe('optimistic support toggle', () => {
  it('shows support immediately, then keeps it on success', async () => {
    const pending = deferred();
    add.mockReturnValue(pending.promise);

    const done = useCommunityStore.getState().toggleSupport(client, 'p1');
    expect(useCommunityStore.getState().mySupport.p1).toBe(true);

    pending.resolve({ ok: true, value: 'p1' });
    await expect(done).resolves.toBe(true);
    expect(useCommunityStore.getState().mySupport.p1).toBe(true);
    expect(useCommunityStore.getState().actionError).toBeNull();
  });

  it('rolls back and surfaces a gentle error when adding fails', async () => {
    const pending = deferred();
    add.mockReturnValue(pending.promise);

    const done = useCommunityStore.getState().toggleSupport(client, 'p1');
    expect(useCommunityStore.getState().mySupport.p1).toBe(true);

    pending.resolve({ ok: false, error: 'We could not update your support.' });
    await expect(done).resolves.toBe(false);
    expect(useCommunityStore.getState().mySupport.p1).toBe(false);
    expect(useCommunityStore.getState().actionError).toBe(
      'We could not update your support.',
    );
  });

  it('rolls back a removal that fails', async () => {
    useCommunityStore.setState({ mySupport: { p1: true } });
    remove.mockResolvedValue({ ok: false, error: 'offline' });

    await expect(
      useCommunityStore.getState().toggleSupport(client, 'p1'),
    ).resolves.toBe(false);
    expect(useCommunityStore.getState().mySupport.p1).toBe(true);
    expect(useCommunityStore.getState().actionError).toBe('offline');
  });

  it('rolls back and reports an error when the request throws', async () => {
    add.mockRejectedValue(new Error('network'));

    await expect(
      useCommunityStore.getState().toggleSupport(client, 'p1'),
    ).resolves.toBe(false);
    expect(useCommunityStore.getState().mySupport.p1).toBe(false);
    expect(useCommunityStore.getState().actionError).toEqual(
      expect.any(String),
    );
  });

  it('ignores a second tap while the first request is in flight', async () => {
    const pending = deferred();
    add.mockReturnValue(pending.promise);

    const first = useCommunityStore.getState().toggleSupport(client, 'p1');
    const second = useCommunityStore.getState().toggleSupport(client, 'p1');
    await expect(second).resolves.toBe(false);
    expect(add).toHaveBeenCalledTimes(1);
    expect(remove).not.toHaveBeenCalled();
    expect(useCommunityStore.getState().mySupport.p1).toBe(true);

    pending.resolve({ ok: true, value: 'p1' });
    await first;
  });
});
