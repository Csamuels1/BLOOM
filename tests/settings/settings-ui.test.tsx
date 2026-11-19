import type { Session } from '@supabase/supabase-js';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';
import { Share } from 'react-native';

import { settingsCopy as copy } from '@/content/settings';
import { useAuthStore } from '@/features/auth';
import { useProfileStore, type Profile } from '@/features/profile';
import { LegalPlaceholderScreen, SettingsScreen } from '@/features/settings';
import * as service from '@/features/settings/settingsService';
import { useSubscriptionStore } from '@/features/subscription';
import type { AppSupabaseClient } from '@/lib/supabase';

// babel-jest hoists these. The settings barrel re-exports are non-configurable,
// so the underlying service module is mocked (the screen resolves to it too).
jest.mock('@/features/settings/settingsService', () => ({
  fetchSettingsProfile: jest.fn(),
  saveTrackCycle: jest.fn(),
  requestExport: jest.fn(),
  requestDeletion: jest.fn(),
  requestSignOut: jest.fn(),
}));
jest.mock('@/design/useReducedMotion', () => ({
  useReducedMotion: () => false,
}));
jest.mock('@/lib/supabase', () => ({ getSupabaseClient: () => ({}) }));
const mockNavigate = jest.fn();
jest.mock('expo-router', () => ({
  router: { navigate: (...a: unknown[]) => mockNavigate(...a) },
}));

const mocked = {
  fetch: jest.mocked(service.fetchSettingsProfile),
  save: jest.mocked(service.saveTrackCycle),
  exportData: jest.mocked(service.requestExport),
  remove: jest.mocked(service.requestDeletion),
  signOut: jest.mocked(service.requestSignOut),
};

const client = {} as AppSupabaseClient;

function profile(overrides: Partial<Profile> = {}): Profile {
  return { id: 'u1', track_cycle: false, ...overrides } as Profile;
}

/** A promise the test resolves by hand, to model a slow network. */
function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((r) => {
    resolve = r;
  });
  return { promise, resolve };
}

function renderSettings() {
  return render(<SettingsScreen client={client} />);
}

beforeEach(() => {
  jest.clearAllMocks();
  useAuthStore.setState({
    status: 'authenticated',
    session: { user: { id: 'u1', email: 'mia@example.com' } } as Session,
  });
  useProfileStore.setState({ profile: null, status: 'idle' });
  useSubscriptionStore.getState().clear();
  mocked.fetch.mockResolvedValue({ ok: true, value: profile() });
});

describe('Settings hub — sections and navigation', () => {
  it('shows the signed-in email, the plan, and every section', async () => {
    renderSettings();
    expect(screen.getByText('mia@example.com')).toBeOnTheScreen();
    expect(screen.getByText(copy.planFree)).toBeOnTheScreen();
    for (const title of [
      copy.accountTitle,
      copy.notificationsTitle,
      copy.privacyTitle,
      copy.legalTitle,
      copy.helpTitle,
    ]) {
      expect(screen.getByText(title)).toBeOnTheScreen();
    }
    await screen.findByText(copy.cycleLabel);
  });

  it('shows Pro from a fresh, same-user entitlement', async () => {
    useSubscriptionStore.setState({
      entitlement: { isPro: true } as never,
      checkedAt: Date.now(),
      ownerId: 'u1',
      status: 'loaded',
    });
    renderSettings();
    expect(screen.getByText(copy.planPro)).toBeOnTheScreen();
    await screen.findByText(copy.cycleLabel);
  });

  it('shows plan checking and a retryable plan error', async () => {
    useSubscriptionStore.setState({ status: 'loading' });
    const view = renderSettings();
    expect(screen.getByText(copy.planChecking)).toBeOnTheScreen();
    await screen.findByText(copy.cycleLabel);

    act(() => useSubscriptionStore.setState({ status: 'error' }));
    expect(screen.getByText(copy.planError)).toBeOnTheScreen();
    view.unmount();
  });

  it.each([
    [copy.notificationsLink, '/notifications'],
    [copy.planLink, '/paywall'],
    [copy.blockedLink, '/blocked'],
    [copy.reportsLink, '/my-reports'],
    [copy.privacyPolicyLink, '/privacy-policy'],
    [copy.termsLink, '/terms'],
    [copy.supportLink, '/support'],
  ])('“%s” navigates to %s', async (label, href) => {
    renderSettings();
    await screen.findByText(copy.cycleLabel);
    fireEvent.press(screen.getByLabelText(label));
    expect(mockNavigate).toHaveBeenCalledWith(href);
  });
});

describe('Cycle preference — state matrix and server truth', () => {
  it('loading: shows the loading state while the profile read is slow', async () => {
    const slow =
      deferred<Awaited<ReturnType<typeof service.fetchSettingsProfile>>>();
    mocked.fetch.mockReturnValue(slow.promise);
    renderSettings();
    expect(screen.getByText(copy.loadingLabel)).toBeOnTheScreen();
    expect(screen.queryByText(copy.cycleLabel)).toBeNull();

    await act(async () => slow.resolve({ ok: true, value: profile() }));
    expect(screen.queryByText(copy.loadingLabel)).toBeNull();
    expect(screen.getByText(copy.cycleLabel)).toBeOnTheScreen();
  });

  it('error: shows a retryable error, and retry re-reads the server', async () => {
    mocked.fetch.mockResolvedValueOnce({ ok: false });
    renderSettings();
    expect(
      await screen.findByText(copy.preferencesLoadError),
    ).toBeOnTheScreen();

    fireEvent.press(screen.getByText(copy.retry));
    expect(await screen.findByText(copy.cycleLabel)).toBeOnTheScreen();
    expect(mocked.fetch).toHaveBeenCalledTimes(2);
  });

  it('empty: invites setup when no profile exists yet', async () => {
    mocked.fetch.mockResolvedValue({ ok: true, value: null });
    renderSettings();
    expect(
      await screen.findByText(copy.preferencesEmptyTitle),
    ).toBeOnTheScreen();
  });

  it('success: reflects the server value even over a stale local profile', async () => {
    useProfileStore.setState({
      profile: profile({ track_cycle: true }),
      status: 'loaded',
    });
    mocked.fetch.mockResolvedValue({
      ok: true,
      value: profile({ track_cycle: false }),
    });
    renderSettings();
    await waitFor(() =>
      expect(screen.getByRole('checkbox')).toHaveProp('accessibilityState', {
        checked: false,
      }),
    );
  });

  it('persists a toggle and shows the value the server returned', async () => {
    // Asked for true; the server stored false — the UI must show false.
    mocked.save.mockResolvedValue({
      ok: true,
      value: profile({ track_cycle: false }),
    });
    renderSettings();
    fireEvent.press(await screen.findByRole('checkbox'));

    await screen.findByText(copy.cycleSaved);
    expect(mocked.save).toHaveBeenCalledWith(client, 'u1', true);
    expect(screen.getByRole('checkbox')).toHaveProp('accessibilityState', {
      checked: false,
    });
    expect(useProfileStore.getState().profile?.track_cycle).toBe(false);
  });

  it('shows saving during a slow save, then the confirmed server value', async () => {
    const slow = deferred<Awaited<ReturnType<typeof service.saveTrackCycle>>>();
    mocked.save.mockReturnValue(slow.promise);
    renderSettings();
    fireEvent.press(await screen.findByRole('checkbox'));

    expect(screen.getByText(copy.cycleSaving)).toBeOnTheScreen();
    // A second tap while in flight is ignored (no duplicate writes).
    fireEvent.press(screen.getByRole('checkbox'));
    expect(mocked.save).toHaveBeenCalledTimes(1);

    await act(async () =>
      slow.resolve({ ok: true, value: profile({ track_cycle: true }) }),
    );
    expect(screen.queryByText(copy.cycleSaving)).toBeNull();
    expect(screen.getByRole('checkbox')).toHaveProp('accessibilityState', {
      checked: true,
    });
  });

  it('reverts and shows a retryable error when the save fails', async () => {
    mocked.save.mockResolvedValueOnce({ ok: false });
    renderSettings();
    fireEvent.press(await screen.findByRole('checkbox'));

    expect(await screen.findByText(copy.cycleError)).toBeOnTheScreen();
    expect(screen.getByRole('checkbox')).toHaveProp('accessibilityState', {
      checked: false,
    });
    expect(useProfileStore.getState().profile?.track_cycle).toBe(false);

    mocked.save.mockResolvedValueOnce({
      ok: true,
      value: profile({ track_cycle: true }),
    });
    fireEvent.press(screen.getByText(copy.retry));
    expect(await screen.findByText(copy.cycleSaved)).toBeOnTheScreen();
    expect(mocked.save).toHaveBeenLastCalledWith(client, 'u1', true);
  });
});

describe('Export', () => {
  it('shows working on a slow export, then ready with a share action', async () => {
    const slow = deferred<Awaited<ReturnType<typeof service.requestExport>>>();
    mocked.exportData.mockReturnValue(slow.promise);
    const share = jest
      .spyOn(Share, 'share')
      .mockResolvedValue({ action: 'sharedAction' });
    renderSettings();
    await screen.findByText(copy.cycleLabel);

    fireEvent.press(screen.getByText(copy.exportData));
    expect(screen.getByLabelText(copy.exportData)).toBeDisabled();

    await act(async () => slow.resolve({ ok: true, value: { profile: {} } }));
    expect(screen.getByText(copy.exportReady)).toBeOnTheScreen();

    fireEvent.press(screen.getByText(copy.exportShare));
    await waitFor(() => expect(share).toHaveBeenCalled());
    expect(share.mock.calls[0]?.[0]).toMatchObject({
      message: JSON.stringify({ profile: {} }, null, 2),
    });
  });

  it('shows a retryable error when the export fails', async () => {
    mocked.exportData.mockResolvedValueOnce({ ok: false });
    renderSettings();
    await screen.findByText(copy.cycleLabel);
    fireEvent.press(screen.getByText(copy.exportData));
    expect(await screen.findByText(copy.exportError)).toBeOnTheScreen();

    mocked.exportData.mockResolvedValueOnce({ ok: true, value: {} });
    fireEvent.press(screen.getByText(copy.retry));
    expect(await screen.findByText(copy.exportReady)).toBeOnTheScreen();
  });

  it('surfaces a sharing failure instead of failing silently', async () => {
    mocked.exportData.mockResolvedValue({ ok: true, value: {} });
    jest.spyOn(Share, 'share').mockRejectedValue(new Error('unsupported'));
    renderSettings();
    await screen.findByText(copy.cycleLabel);
    fireEvent.press(screen.getByText(copy.exportData));
    fireEvent.press(await screen.findByText(copy.exportShare));
    expect(await screen.findByText(copy.exportShareError)).toBeOnTheScreen();
  });
});

describe('Delete account', () => {
  it('requires an in-page confirmation and can be cancelled', async () => {
    renderSettings();
    await screen.findByText(copy.cycleLabel);
    fireEvent.press(screen.getByText(copy.deleteAccount));
    expect(screen.getByText(copy.deleteConfirmTitle)).toBeOnTheScreen();
    expect(mocked.remove).not.toHaveBeenCalled();

    fireEvent.press(screen.getByText(copy.deleteCancel));
    expect(screen.queryByText(copy.deleteConfirmTitle)).toBeNull();
  });

  it('deletes on confirm, shows progress on a slow call, and clears the profile', async () => {
    const slow =
      deferred<Awaited<ReturnType<typeof service.requestDeletion>>>();
    mocked.remove.mockReturnValue(slow.promise);
    renderSettings();
    await screen.findByText(copy.cycleLabel);
    fireEvent.press(screen.getByText(copy.deleteAccount));
    fireEvent.press(screen.getByText(copy.deleteConfirm));

    expect(mocked.remove).toHaveBeenCalledWith(client, 'u1');
    expect(screen.getByLabelText(copy.deleteConfirm)).toBeDisabled();

    await act(async () => slow.resolve({ ok: true, value: null }));
    expect(screen.getByText(copy.deleteDone)).toBeOnTheScreen();
    expect(useProfileStore.getState().profile).toBeNull();
  });

  it('shows a visible error when deletion fails and keeps the account', async () => {
    mocked.remove.mockResolvedValue({ ok: false });
    renderSettings();
    await screen.findByText(copy.cycleLabel);
    fireEvent.press(screen.getByText(copy.deleteAccount));
    fireEvent.press(screen.getByText(copy.deleteConfirm));

    expect(await screen.findByText(copy.deleteError)).toBeOnTheScreen();
    expect(screen.getByText(copy.deleteConfirm)).toBeOnTheScreen();
    expect(useProfileStore.getState().profile).not.toBeNull();
  });
});

describe('Sign out', () => {
  it('signs out through the service', async () => {
    mocked.signOut.mockResolvedValue({ ok: true, value: null });
    renderSettings();
    await screen.findByText(copy.cycleLabel);
    fireEvent.press(screen.getByText(copy.signOut));
    await waitFor(() => expect(mocked.signOut).toHaveBeenCalledWith(client));
    expect(screen.queryByText(copy.signOutError)).toBeNull();
  });

  it('shows a visible error when sign-out fails', async () => {
    mocked.signOut.mockResolvedValue({ ok: false });
    renderSettings();
    await screen.findByText(copy.cycleLabel);
    fireEvent.press(screen.getByText(copy.signOut));
    expect(await screen.findByText(copy.signOutError)).toBeOnTheScreen();
  });
});

describe('Legal placeholders', () => {
  it.each([
    ['privacy', copy.privacyPolicyTitle],
    ['terms', copy.termsTitle],
  ] as const)('%s is clearly marked as a placeholder', (kind, title) => {
    render(<LegalPlaceholderScreen kind={kind} />);
    expect(screen.getByText(title)).toBeOnTheScreen();
    expect(screen.getByText(copy.legalPlaceholderLabel)).toBeOnTheScreen();
    expect(screen.getByText(copy.legalPlaceholderBody)).toBeOnTheScreen();
    fireEvent.press(screen.getByText(copy.backToSettings));
    expect(mockNavigate).toHaveBeenCalledWith('/settings');
  });
});
