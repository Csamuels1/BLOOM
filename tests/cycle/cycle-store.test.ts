import type { AppSupabaseClient } from '@/lib/supabase';
import { useCycleStore, type CycleStart } from '@/features/cycle';

function asClient(value: unknown) {
  return value as AppSupabaseClient;
}

function entry(partial: Partial<CycleStart>): CycleStart {
  return {
    id: 'c1',
    user_id: 'u1',
    started_on: '2026-11-01',
    created_at: '2026-11-01T08:00:00Z',
    ...partial,
  };
}

/** A client whose list query resolves to the given result. */
function listClient(result: { data: unknown; error: unknown }) {
  return asClient({
    from: () => ({ select: () => ({ order: async () => result }) }),
  });
}

/** A client whose insert resolves to the given row, with a signed-in user. */
function insertClient(result: { data: unknown; error: unknown }) {
  return asClient({
    auth: {
      getUser: async () => ({ data: { user: { id: 'u1' } }, error: null }),
    },
    from: () => ({
      insert: () => ({ select: () => ({ single: async () => result }) }),
    }),
  });
}

/** A client whose bulk delete resolves to the given error (or none). */
function clearClient(error: unknown) {
  return asClient({
    auth: {
      getUser: async () => ({ data: { user: { id: 'u1' } }, error: null }),
    },
    from: () => ({ delete: () => ({ eq: async () => ({ error }) }) }),
  });
}

afterEach(() => {
  useCycleStore.setState({ entries: [], status: 'idle', error: null });
});

describe('cycle store load', () => {
  it('loads starts and marks the status loaded', async () => {
    const rows = [entry({ id: 'c2', started_on: '2026-11-29' }), entry({})];
    await useCycleStore
      .getState()
      .load(listClient({ data: rows, error: null }));

    const state = useCycleStore.getState();
    expect(state.status).toBe('loaded');
    expect(state.entries).toHaveLength(2);
    expect(state.error).toBeNull();
  });

  it('surfaces a retryable error and keeps prior entries on failure', async () => {
    useCycleStore.setState({ entries: [entry({})], status: 'loaded' });
    await useCycleStore
      .getState()
      .load(listClient({ data: null, error: { message: 'offline' } }));

    const state = useCycleStore.getState();
    expect(state.status).toBe('error');
    expect(state.error).toMatch(/could not load/i);
    expect(state.entries).toHaveLength(1);
  });
});

describe('cycle store add', () => {
  it('prepends a new start on success, keeping newest first', async () => {
    useCycleStore.setState({
      entries: [entry({ id: 'old', started_on: '2026-10-01' })],
      status: 'loaded',
    });
    const created = entry({ id: 'new', started_on: '2026-11-01' });

    const ok = await useCycleStore
      .getState()
      .add(insertClient({ data: created, error: null }), '2026-11-01');

    expect(ok).toBe(true);
    const entries = useCycleStore.getState().entries;
    expect(entries[0]?.id).toBe('new');
    expect(entries).toHaveLength(2);
  });

  it('sets a gentle error and leaves entries untouched on failure', async () => {
    const existing = [entry({ id: 'keep' })];
    useCycleStore.setState({ entries: existing, status: 'loaded' });

    const ok = await useCycleStore
      .getState()
      .add(
        insertClient({ data: null, error: { message: 'offline' } }),
        '2026-11-01',
      );

    expect(ok).toBe(false);
    const state = useCycleStore.getState();
    expect(state.error).toMatch(/could not save/i);
    expect(state.entries).toEqual(existing);
  });
});

describe('cycle store remove', () => {
  it('removes a start on success and keeps it on failure', async () => {
    useCycleStore.setState({ entries: [entry({ id: 'c1' })] });
    const okClient = asClient({
      from: () => ({ delete: () => ({ eq: async () => ({ error: null }) }) }),
    });
    const removed = await useCycleStore.getState().remove(okClient, 'c1');
    expect(removed).toBe(true);
    expect(useCycleStore.getState().entries).toHaveLength(0);

    useCycleStore.setState({ entries: [entry({ id: 'c2' })] });
    const failClient = asClient({
      from: () => ({
        delete: () => ({ eq: async () => ({ error: { message: 'no' } }) }),
      }),
    });
    const kept = await useCycleStore.getState().remove(failClient, 'c2');
    expect(kept).toBe(false);
    expect(useCycleStore.getState().entries).toHaveLength(1);
    expect(useCycleStore.getState().error).toMatch(/could not remove/i);
  });
});

describe('cycle store clearHistory (disable flow)', () => {
  it('empties history on success', async () => {
    useCycleStore.setState({
      entries: [entry({ id: 'c1' }), entry({ id: 'c2' })],
      status: 'loaded',
    });

    const ok = await useCycleStore.getState().clearHistory(clearClient(null));
    expect(ok).toBe(true);
    expect(useCycleStore.getState().entries).toHaveLength(0);
    expect(useCycleStore.getState().status).toBe('loaded');
  });

  it('keeps every date and surfaces an error when the bulk delete fails', async () => {
    const existing = [entry({ id: 'c1' }), entry({ id: 'c2' })];
    useCycleStore.setState({ entries: existing, status: 'loaded' });

    const ok = await useCycleStore
      .getState()
      .clearHistory(clearClient({ message: 'offline' }));

    expect(ok).toBe(false);
    expect(useCycleStore.getState().entries).toEqual(existing);
    expect(useCycleStore.getState().error).toMatch(/could not clear/i);
  });
});
