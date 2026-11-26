import type { Session } from '@supabase/supabase-js';
import { Text } from 'react-native';
import { fireEvent, renderRouter, screen } from 'expo-router/testing-library';

import AppLayout, {
  unstable_settings as appSettings,
} from '@/app/(app)/_layout';
import TabsLayout from '@/app/(app)/(tabs)/_layout';
import { RootNavigator } from '@/app/_layout';
import { navigationCopy as copy } from '@/content/navigation';
import { screenAnimation } from '@/design/screenTransitions';
import { useAuthStore } from '@/features/auth';

// The (app) layout syncs entitlements on mount; keep this test offline.
jest.mock('@/features/subscription', () => ({
  useEntitlementSync: () => undefined,
}));

const stub = (label: string) =>
  function Stub() {
    return <Text>{label}</Text>;
  };

const routes = {
  _layout: RootNavigator,
  '(app)/_layout': { default: AppLayout, unstable_settings: appSettings },
  '(app)/(tabs)/_layout': TabsLayout,
  '(app)/(tabs)/index': stub('Today screen'),
  '(app)/(tabs)/progress': stub('Progress screen'),
  '(app)/(tabs)/community': stub('Community screen'),
  '(app)/(tabs)/settings': stub('Settings screen'),
  '(app)/weight-log': stub('Weight log screen'),
};

beforeEach(() => {
  useAuthStore.setState({
    status: 'authenticated',
    session: { user: { id: 'u1' } } as Session,
  });
});

afterEach(() => {
  useAuthStore.setState({ status: 'loading', session: null });
});

describe('bottom tab bar (#149)', () => {
  it('lands on Today with four labelled tabs', async () => {
    renderRouter(routes, { initialUrl: '/' });

    expect(await screen.findByText('Today screen')).toBeOnTheScreen();
    for (const label of [
      copy.tabToday,
      copy.tabProgress,
      copy.tabCommunity,
      copy.tabSettings,
    ]) {
      expect(screen.getByLabelText(label)).toBeOnTheScreen();
    }
  });

  it('switches tabs and keeps the existing URLs', async () => {
    const view = renderRouter(routes, { initialUrl: '/' });
    await screen.findByText('Today screen');

    fireEvent.press(screen.getByLabelText(copy.tabProgress));
    expect(await screen.findByText('Progress screen')).toBeOnTheScreen();
    expect(view.getPathname()).toBe('/progress');

    fireEvent.press(screen.getByLabelText(copy.tabSettings));
    expect(await screen.findByText('Settings screen')).toBeOnTheScreen();
    expect(view.getPathname()).toBe('/settings');
  });

  it('opens a deep link to a pushed screen over the tabs', async () => {
    const view = renderRouter(routes, { initialUrl: '/weight-log' });

    expect(await screen.findByText('Weight log screen')).toBeOnTheScreen();
    expect(view.getPathname()).toBe('/weight-log');
  });

  it('starts the signed-in area on the tabs', () => {
    expect(appSettings.initialRouteName).toBe('(tabs)');
  });
});

describe('screen transitions (#149)', () => {
  it('uses native pushes and a fade between areas', () => {
    expect(screenAnimation('push', false)).toBe('default');
    expect(screenAnimation('switch', false)).toBe('fade');
  });

  it('turns every transition off under Reduce Motion', () => {
    expect(screenAnimation('push', true)).toBe('none');
    expect(screenAnimation('switch', true)).toBe('none');
  });
});
