import type { AppSupabaseClient } from '@/lib/supabase';
import { useProfileStore } from '@/features/profile';

function clientReturning(result: { data: unknown; error: unknown }) {
  return {
    from: () => ({ select: () => ({ maybeSingle: async () => result }) }),
  } as unknown as AppSupabaseClient;
}

afterEach(() => {
  useProfileStore.setState({ profile: null, status: 'idle' });
});

describe('profile store load', () => {
  it('loads the profile and marks the status loaded', async () => {
    await useProfileStore
      .getState()
      .load(clientReturning({ data: { id: 'u1' }, error: null }));

    expect(useProfileStore.getState().status).toBe('loaded');
    expect(useProfileStore.getState().profile).toEqual({ id: 'u1' });
  });

  it('surfaces a retryable error state when the load fails', async () => {
    await useProfileStore
      .getState()
      .load(clientReturning({ data: null, error: { message: 'offline' } }));

    expect(useProfileStore.getState().status).toBe('error');
  });

  it('recovers to loaded when a retry succeeds', async () => {
    const store = useProfileStore.getState();
    await store.load(clientReturning({ data: null, error: { message: 'x' } }));
    expect(useProfileStore.getState().status).toBe('error');

    await store.load(clientReturning({ data: { id: 'u2' }, error: null }));
    expect(useProfileStore.getState().status).toBe('loaded');
    expect(useProfileStore.getState().profile).toEqual({ id: 'u2' });
  });
});
