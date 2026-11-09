import type {
  AuthChangeEvent,
  Session,
  SupabaseClient,
} from '@supabase/supabase-js';

import { useAuthStore } from '@/features/auth/authStore';

type Listener = (event: AuthChangeEvent, session: Session | null) => void;

function fakeSession(expiresAt: number): Session {
  return {
    access_token: `token-${expiresAt}`,
    refresh_token: `refresh-${expiresAt}`,
    expires_in: 3600,
    expires_at: expiresAt,
    token_type: 'bearer',
    user: { id: 'user-1' },
  } as unknown as Session;
}

function makeClient() {
  let listener: Listener | undefined;
  const unsubscribe = jest.fn();
  const signOut = jest.fn().mockResolvedValue({ error: null });

  const client = {
    auth: {
      onAuthStateChange: (fn: Listener) => {
        listener = fn;
        return { data: { subscription: { unsubscribe } } };
      },
      signOut,
    },
  } as unknown as SupabaseClient;

  return {
    client,
    unsubscribe,
    signOut,
    emit(event: AuthChangeEvent, session: Session | null) {
      if (!listener) throw new Error('initialize was not called');
      listener(event, session);
    },
  };
}

beforeEach(() => {
  useAuthStore.setState({ status: 'loading', session: null });
});

describe('auth store', () => {
  it('starts in the loading state before restoration resolves', () => {
    expect(useAuthStore.getState().status).toBe('loading');
    expect(useAuthStore.getState().session).toBeNull();
  });

  it('restores a persisted session from the initial auth event', () => {
    const { client, emit } = makeClient();
    useAuthStore.getState().initialize(client);

    const restored = fakeSession(1000);
    emit('INITIAL_SESSION', restored);

    expect(useAuthStore.getState().status).toBe('authenticated');
    expect(useAuthStore.getState().session).toBe(restored);
  });

  it('stays authenticated and swaps the session on token refresh', () => {
    const { client, emit } = makeClient();
    useAuthStore.getState().initialize(client);

    emit('INITIAL_SESSION', fakeSession(1000));
    const refreshed = fakeSession(5000);
    emit('TOKEN_REFRESHED', refreshed);

    expect(useAuthStore.getState().status).toBe('authenticated');
    expect(useAuthStore.getState().session).toBe(refreshed);
  });

  it('drops to unauthenticated when a refresh fails or expires', () => {
    const { client, emit } = makeClient();
    useAuthStore.getState().initialize(client);

    emit('INITIAL_SESSION', fakeSession(1000));
    // Supabase emits a null session when the refresh token is invalid/expired.
    emit('SIGNED_OUT', null);

    expect(useAuthStore.getState().status).toBe('unauthenticated');
    expect(useAuthStore.getState().session).toBeNull();
  });

  it('restores as unauthenticated when storage holds no session (offline relaunch)', () => {
    const { client, emit } = makeClient();
    useAuthStore.getState().initialize(client);

    emit('INITIAL_SESSION', null);

    expect(useAuthStore.getState().status).toBe('unauthenticated');
  });

  it('signs out through the client and lets the auth event clear state', async () => {
    const { client, signOut, emit } = makeClient();
    useAuthStore.getState().initialize(client);
    emit('INITIAL_SESSION', fakeSession(1000));

    await useAuthStore.getState().signOut(client);
    expect(signOut).toHaveBeenCalledTimes(1);

    // State clears from the emitted SIGNED_OUT event, not an optimistic write.
    expect(useAuthStore.getState().status).toBe('authenticated');
    emit('SIGNED_OUT', null);
    expect(useAuthStore.getState().status).toBe('unauthenticated');
  });

  it('unsubscribes from auth changes on teardown', () => {
    const { client, unsubscribe } = makeClient();
    const cleanup = useAuthStore.getState().initialize(client);

    expect(unsubscribe).not.toHaveBeenCalled();
    cleanup();
    expect(unsubscribe).toHaveBeenCalledTimes(1);
  });
});
