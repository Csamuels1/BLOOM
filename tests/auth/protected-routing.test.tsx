import type { Session } from '@supabase/supabase-js';
import { router } from 'expo-router';
import { act, renderRouter, screen } from 'expo-router/testing-library';

import AppLayout from '@/app/(app)/_layout';
import FoundationScreen from '@/app/(app)/foundation';
import HomeScreen from '@/app/(app)/index';
import AuthLayout from '@/app/(auth)/_layout';
import SignInScreen from '@/app/(auth)/sign-in';
import { RootNavigator } from '@/app/_layout';
import { authCopy } from '@/content/auth';
import { foundationCopy } from '@/content/foundation';
import { todayCopy } from '@/content/today';
import { useAuthStore } from '@/features/auth';

// The home screen loads the profile on mount (for region-aware meals). Keep the
// routing test offline with a stub client whose profile read resolves empty.
jest.mock('@/lib/supabase', () => ({
  getSupabaseClient: () => ({
    from: () => ({
      select: () => ({
        maybeSingle: async () => ({ data: null, error: null }),
      }),
    }),
    auth: { signOut: async () => ({ error: null }) },
  }),
}));

const routes = {
  _layout: RootNavigator,
  '(auth)/_layout': AuthLayout,
  '(auth)/sign-in': SignInScreen,
  '(app)/_layout': AppLayout,
  '(app)/index': HomeScreen,
  '(app)/foundation': FoundationScreen,
};

function setAuth(status: 'authenticated' | 'unauthenticated') {
  const session =
    status === 'authenticated' ? ({ user: { id: 'u1' } } as Session) : null;
  useAuthStore.setState({ status, session });
}

afterEach(() => {
  useAuthStore.setState({ status: 'loading', session: null });
});

describe('protected routing', () => {
  it('sends signed-out users to the sign-in screen', async () => {
    setAuth('unauthenticated');
    renderRouter(routes, { initialUrl: '/' });

    expect(await screen.findByText(authCopy.signInIntro)).toBeOnTheScreen();
    expect(screen.queryByText(todayCopy.intro)).toBeNull();
  });

  it('cannot reach a protected route by navigating to it while signed out', async () => {
    setAuth('unauthenticated');
    renderRouter(routes, { initialUrl: '/' });

    await screen.findByText(authCopy.signInIntro);
    act(() => router.navigate('/foundation'));

    // The (app) group is not in the tree while signed out, so the protected
    // screen never renders — the guard is not just hiding UI.
    expect(screen.queryByText(foundationCopy.title)).toBeNull();
    expect(screen.getByText(authCopy.signInIntro)).toBeOnTheScreen();
  });

  it('shows the protected home to signed-in users', async () => {
    setAuth('authenticated');
    renderRouter(routes, { initialUrl: '/' });

    expect(await screen.findByText(todayCopy.intro)).toBeOnTheScreen();
    expect(screen.queryByText(authCopy.signInIntro)).toBeNull();
  });

  it('keeps signed-in users out of the auth group', async () => {
    setAuth('authenticated');
    renderRouter(routes, { initialUrl: '/' });

    await screen.findByText(todayCopy.intro);
    act(() => router.navigate('/sign-in'));

    expect(screen.queryByText(authCopy.signInIntro)).toBeNull();
    expect(screen.getByText(todayCopy.intro)).toBeOnTheScreen();
  });

  it('can reach the foundation screen within the app group while signed in', async () => {
    setAuth('authenticated');
    const view = renderRouter(routes, { initialUrl: '/' });

    await screen.findByText(todayCopy.intro);
    act(() => router.navigate('/foundation'));

    expect(await screen.findByText(foundationCopy.title)).toBeOnTheScreen();
    expect(view.getPathname()).toBe('/foundation');
  });
});
