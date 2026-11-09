import type { Session } from '@supabase/supabase-js';
import { router } from 'expo-router';
import {
  act,
  fireEvent,
  renderRouter,
  screen,
} from 'expo-router/testing-library';

import AppLayout from '@/app/(app)/_layout';
import FoundationScreen from '@/app/(app)/foundation';
import HomeScreen from '@/app/(app)/index';
import AuthLayout from '@/app/(auth)/_layout';
import SignInScreen from '@/app/(auth)/sign-in';
import { RootNavigator } from '@/app/_layout';
import { authCopy } from '@/content/auth';
import { foundationCopy } from '@/content/foundation';
import { homeCopy } from '@/content/home';
import { useAuthStore } from '@/features/auth';

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

    expect(await screen.findByText(authCopy.signInBody)).toBeOnTheScreen();
    expect(screen.queryByText(homeCopy.body)).toBeNull();
  });

  it('cannot reach a protected route by navigating to it while signed out', async () => {
    setAuth('unauthenticated');
    renderRouter(routes, { initialUrl: '/' });

    await screen.findByText(authCopy.signInBody);
    act(() => router.navigate('/foundation'));

    // The (app) group is not in the tree while signed out, so the protected
    // screen never renders — the guard is not just hiding UI.
    expect(screen.queryByText(foundationCopy.title)).toBeNull();
    expect(screen.getByText(authCopy.signInBody)).toBeOnTheScreen();
  });

  it('shows the protected home to signed-in users', async () => {
    setAuth('authenticated');
    renderRouter(routes, { initialUrl: '/' });

    expect(await screen.findByText(homeCopy.body)).toBeOnTheScreen();
    expect(screen.queryByText(authCopy.signInBody)).toBeNull();
  });

  it('keeps signed-in users out of the auth group', async () => {
    setAuth('authenticated');
    renderRouter(routes, { initialUrl: '/' });

    await screen.findByText(homeCopy.body);
    act(() => router.navigate('/sign-in'));

    expect(screen.queryByText(authCopy.signInBody)).toBeNull();
    expect(screen.getByText(homeCopy.body)).toBeOnTheScreen();
  });

  it('navigates from home to the foundation demo while signed in', async () => {
    setAuth('authenticated');
    const view = renderRouter(routes, { initialUrl: '/' });

    await screen.findByText(homeCopy.body);
    fireEvent.press(
      screen.getByRole('link', { name: homeCopy.exploreFoundation }),
    );

    expect(await screen.findByText(foundationCopy.title)).toBeOnTheScreen();
    expect(view.getPathname()).toBe('/foundation');
  });
});
