import type { Session } from '@supabase/supabase-js';
import { fireEvent, renderRouter, screen } from 'expo-router/testing-library';

import AppLayout from '@/app/(app)/_layout';
import HomeScreen from '@/app/(app)/index';
import PrivacyPolicyRoute from '@/app/(app)/privacy-policy';
import SettingsRoute from '@/app/(app)/settings';
import { RootNavigator } from '@/app/_layout';
import { moderationCopy } from '@/content/moderation';
import { settingsCopy } from '@/content/settings';
import { supportCopy } from '@/content/support';
import { todayCopy } from '@/content/today';
import { useAuthStore } from '@/features/auth';
import { useProfileStore } from '@/features/profile';

// E2E-style flow through the real routes with an offline stub client: the
// profile read resolves to a saved profile, so Settings reaches its loaded state.
jest.mock('@/lib/supabase', () => ({
  getSupabaseClient: () => ({
    from: () => ({
      select: () => ({
        maybeSingle: async () => ({
          data: { id: 'u1', track_cycle: true },
          error: null,
        }),
      }),
    }),
    auth: { signOut: async () => ({ error: null }) },
  }),
}));
jest.mock('@/design/useReducedMotion', () => ({
  useReducedMotion: () => false,
}));

const routes = {
  _layout: RootNavigator,
  '(app)/_layout': AppLayout,
  '(app)/index': HomeScreen,
  '(app)/settings': SettingsRoute,
  '(app)/privacy-policy': PrivacyPolicyRoute,
};

function signIn(role?: string) {
  useAuthStore.setState({
    status: 'authenticated',
    session: {
      user: { id: 'u1', email: 'mia@example.com', app_metadata: { role } },
    } as unknown as Session,
  });
}

afterEach(() => {
  useAuthStore.setState({ status: 'loading', session: null });
  useProfileStore.setState({ profile: null, status: 'idle' });
});

describe('home → settings flow', () => {
  it('home offers a single Settings entry instead of lifecycle actions', async () => {
    signIn();
    renderRouter(routes, { initialUrl: '/' });
    await screen.findByText(todayCopy.intro);

    expect(screen.getByLabelText(settingsCopy.homeLink)).toBeOnTheScreen();
    // Safety (#49): support is one tap from Home, not buried in Settings.
    expect(screen.getByLabelText(supportCopy.title)).toBeOnTheScreen();
    expect(screen.queryByText(settingsCopy.exportData)).toBeNull();
    expect(screen.queryByText(settingsCopy.deleteAccount)).toBeNull();
    expect(screen.queryByText(settingsCopy.signOut)).toBeNull();
    expect(screen.queryByText(moderationCopy.title)).toBeNull();
  });

  it('keeps the Moderation link for moderators', async () => {
    signIn('moderator');
    renderRouter(routes, { initialUrl: '/' });
    await screen.findByText(todayCopy.intro);
    expect(screen.getByLabelText(moderationCopy.title)).toBeOnTheScreen();
  });

  it('opens Settings from home, loads server preferences, and reaches legal', async () => {
    signIn();
    const view = renderRouter(routes, { initialUrl: '/' });
    await screen.findByText(todayCopy.intro);

    fireEvent.press(screen.getByLabelText(settingsCopy.homeLink));
    expect(await screen.findByText(settingsCopy.title)).toBeOnTheScreen();
    expect(view.getPathname()).toBe('/settings');
    expect(screen.getByText('mia@example.com')).toBeOnTheScreen();
    expect(await screen.findByRole('checkbox')).toHaveProp(
      'accessibilityState',
      { checked: true },
    );

    fireEvent.press(screen.getByLabelText(settingsCopy.privacyPolicyLink));
    expect(
      await screen.findByText(settingsCopy.legalPlaceholderBody),
    ).toBeOnTheScreen();
    expect(view.getPathname()).toBe('/privacy-policy');
  });
});
