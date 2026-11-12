import type { AppSupabaseClient } from '@/lib/supabase';
import { useWeightStore, type WeightEntry } from '@/features/weight';

function asClient(value: unknown) {
  return value as AppSupabaseClient;
}

function entry(partial: Partial<WeightEntry>): WeightEntry {
  return {
    id: 'w1',
    user_id: 'u1',
    weight_kg: 68,
    measured_at: '2026-11-10',
    note: null,
    created_at: '2026-11-10T08:00:00Z',
    ...partial,
  };
}

/** A client whose list query resolves to the given result. */
function listClient(result: { data: unknown; error: unknown }) {
  return asClient({
    from: () => ({
      select: () => ({ order: () => ({ order: async () => result }) }),
    }),
  });
}

/** A client whose insert resolves to the given row result, with a signed-in user. */
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

afterEach(() => {
  useWeightStore.setState({ entries: [], status: 'idle', error: null });
});

describe('weight store load', () => {
  it('loads entries and marks the status loaded', async () => {
    const rows = [entry({ id: 'w2', measured_at: '2026-11-11' }), entry({})];
    await useWeightStore
      .getState()
      .load(listClient({ data: rows, error: null }));

    expect(useWeightStore.getState().status).toBe('loaded');
    expect(useWeightStore.getState().entries).toHaveLength(2);
    expect(useWeightStore.getState().error).toBeNull();
  });

  it('surfaces a retryable error and keeps prior entries on failure', async () => {
    useWeightStore.setState({ entries: [entry({})], status: 'loaded' });
    await useWeightStore
      .getState()
      .load(listClient({ data: null, error: { message: 'offline' } }));

    const state = useWeightStore.getState();
    expect(state.status).toBe('error');
    expect(state.error).toMatch(/could not load/i);
    expect(state.entries).toHaveLength(1);
  });
});

describe('weight store add', () => {
  it('prepends a new entry on success, keeping newest first', async () => {
    useWeightStore.setState({
      entries: [entry({ id: 'old', measured_at: '2026-11-01' })],
      status: 'loaded',
    });
    const created = entry({ id: 'new', measured_at: '2026-11-12' });

    const ok = await useWeightStore
      .getState()
      .add(insertClient({ data: created, error: null }), { weightKg: 68 });

    expect(ok).toBe(true);
    const entries = useWeightStore.getState().entries;
    expect(entries[0]?.id).toBe('new');
    expect(entries).toHaveLength(2);
    expect(useWeightStore.getState().error).toBeNull();
  });

  it('sets a gentle error and leaves entries untouched on failure', async () => {
    const existing = [entry({ id: 'keep' })];
    useWeightStore.setState({ entries: existing, status: 'loaded' });

    const ok = await useWeightStore
      .getState()
      .add(insertClient({ data: null, error: { message: 'offline' } }), {
        weightKg: 68,
      });

    expect(ok).toBe(false);
    const state = useWeightStore.getState();
    expect(state.error).toMatch(/could not save/i);
    expect(state.entries).toEqual(existing);
  });
});

describe('weight store update and remove', () => {
  it('replaces the edited entry on success', async () => {
    useWeightStore.setState({ entries: [entry({ id: 'w1', weight_kg: 68 })] });
    const updated = entry({ id: 'w1', weight_kg: 70 });
    const client = asClient({
      from: () => ({
        update: () => ({
          eq: () => ({
            select: () => ({
              single: async () => ({ data: updated, error: null }),
            }),
          }),
        }),
      }),
    });

    const ok = await useWeightStore
      .getState()
      .update(client, 'w1', { weightKg: 70 });

    expect(ok).toBe(true);
    expect(useWeightStore.getState().entries[0]?.weight_kg).toBe(70);
  });

  it('removes an entry on success and keeps it on failure', async () => {
    useWeightStore.setState({ entries: [entry({ id: 'w1' })] });
    const okClient = asClient({
      from: () => ({ delete: () => ({ eq: async () => ({ error: null }) }) }),
    });
    const removed = await useWeightStore.getState().remove(okClient, 'w1');
    expect(removed).toBe(true);
    expect(useWeightStore.getState().entries).toHaveLength(0);

    useWeightStore.setState({ entries: [entry({ id: 'w2' })] });
    const failClient = asClient({
      from: () => ({
        delete: () => ({ eq: async () => ({ error: { message: 'no' } }) }),
      }),
    });
    const kept = await useWeightStore.getState().remove(failClient, 'w2');
    expect(kept).toBe(false);
    expect(useWeightStore.getState().entries).toHaveLength(1);
    expect(useWeightStore.getState().error).toMatch(/could not remove/i);
  });
});
