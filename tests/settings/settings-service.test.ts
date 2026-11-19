import {
  fetchSettingsProfile,
  requestDeletion,
  requestExport,
  requestSignOut,
  saveTrackCycle,
} from '@/features/settings';
import type { AppSupabaseClient } from '@/lib/supabase';

// Minimal stand-ins for the Supabase query builder. Each test supplies only the
// methods the call under test uses; anything missing throws, which the service
// must convert into a visible failure result rather than an unhandled throw.
function asClient(value: unknown): AppSupabaseClient {
  return value as AppSupabaseClient;
}

function updateClient(result: { data: unknown; error: unknown }) {
  const calls: Record<string, unknown[]> = {};
  const record =
    (name: string) =>
    (...args: unknown[]): unknown => {
      calls[name] = args;
      return builder;
    };
  const builder = {
    update: record('update'),
    eq: record('eq'),
    select: record('select'),
    single: async () => result,
  };
  return { calls, client: asClient({ from: record('from') }) };
}

describe('saveTrackCycle', () => {
  it('updates only the caller’s row and returns the server’s stored value', async () => {
    // The server returns false even though true was requested (e.g. a trigger
    // or a concurrent change) — the result must reflect the server, not the ask.
    const { client, calls } = updateClient({
      data: { id: 'u1', track_cycle: false },
      error: null,
    });
    const result = await saveTrackCycle(client, 'u1', true);
    expect(calls.from).toEqual(['profiles']);
    expect(calls.update).toEqual([{ track_cycle: true }]);
    expect(calls.eq).toEqual(['id', 'u1']);
    expect(result).toEqual({
      ok: true,
      value: { id: 'u1', track_cycle: false },
    });
  });

  it('fails on a server error', async () => {
    const { client } = updateClient({ data: null, error: { message: 'rls' } });
    expect(await saveTrackCycle(client, 'u1', true)).toEqual({ ok: false });
  });

  it('fails instead of throwing when the network call throws', async () => {
    const client = asClient({
      from: () => {
        throw new Error('offline');
      },
    });
    expect(await saveTrackCycle(client, 'u1', true)).toEqual({ ok: false });
  });
});

describe('fetchSettingsProfile', () => {
  const profileClient = (result: { data: unknown; error: unknown }) =>
    asClient({
      from: () => ({ select: () => ({ maybeSingle: async () => result }) }),
    });

  it('returns the server profile', async () => {
    const result = await fetchSettingsProfile(
      profileClient({ data: { id: 'u1' }, error: null }),
    );
    expect(result).toEqual({ ok: true, value: { id: 'u1' } });
  });

  it('distinguishes empty (not set up) from failure', async () => {
    expect(
      await fetchSettingsProfile(profileClient({ data: null, error: null })),
    ).toEqual({ ok: true, value: null });
    expect(
      await fetchSettingsProfile(
        profileClient({ data: null, error: { message: 'offline' } }),
      ),
    ).toEqual({ ok: false });
  });
});

describe('requestExport', () => {
  it('returns the export document', async () => {
    const client = asClient({
      rpc: async () => ({ data: { profile: {} }, error: null }),
    });
    expect(await requestExport(client)).toEqual({
      ok: true,
      value: { profile: {} },
    });
  });

  it('fails on error or throw', async () => {
    expect(
      await requestExport(
        asClient({
          rpc: async () => ({ data: null, error: { message: 'x' } }),
        }),
      ),
    ).toEqual({ ok: false });
    expect(
      await requestExport(
        asClient({
          rpc: async () => {
            throw new Error('offline');
          },
        }),
      ),
    ).toEqual({ ok: false });
  });
});

describe('requestDeletion', () => {
  const storage = {
    from: () => ({
      list: async () => ({ data: [], error: null }),
      remove: async () => ({ data: [], error: null }),
    }),
  };

  it('deletes and signs out', async () => {
    const signOut = jest.fn(async () => ({ error: null }));
    const rpc = jest.fn(async () => ({ data: null, error: null }));
    const result = await requestDeletion(
      asClient({ storage, rpc, auth: { signOut } }),
      'u1',
    );
    expect(result).toEqual({ ok: true, value: null });
    expect(rpc).toHaveBeenCalledWith('delete_current_user');
    expect(signOut).toHaveBeenCalled();
  });

  it('fails visibly and keeps the session when the server refuses', async () => {
    const signOut = jest.fn();
    const result = await requestDeletion(
      asClient({
        storage,
        rpc: async () => ({ data: null, error: { message: 'no' } }),
        auth: { signOut },
      }),
      'u1',
    );
    expect(result).toEqual({ ok: false });
    expect(signOut).not.toHaveBeenCalled();
  });

  it('fails instead of throwing', async () => {
    const result = await requestDeletion(
      asClient({
        storage,
        rpc: async () => {
          throw new Error('offline');
        },
      }),
      'u1',
    );
    expect(result).toEqual({ ok: false });
  });
});

describe('requestSignOut', () => {
  it('reports success, a returned error, and a throw', async () => {
    expect(
      await requestSignOut(
        asClient({ auth: { signOut: async () => ({ error: null }) } }),
      ),
    ).toEqual({ ok: true, value: null });
    expect(
      await requestSignOut(
        asClient({
          auth: { signOut: async () => ({ error: { message: 'x' } }) },
        }),
      ),
    ).toEqual({ ok: false });
    expect(
      await requestSignOut(
        asClient({
          auth: {
            signOut: async () => {
              throw new Error('offline');
            },
          },
        }),
      ),
    ).toEqual({ ok: false });
  });
});
