import {
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';
import * as Notifications from 'expo-notifications';

import { notificationsCopy as copy } from '@/content/notifications';
import { NotificationSettings } from '@/features/notifications/NotificationSettings';
import { useNotificationStore } from '@/features/notifications/notificationStore';
import { DEFAULT_PREFS } from '@/features/notifications/notificationPrefs';

jest.mock('@/design/useReducedMotion', () => ({
  useReducedMotion: () => false,
}));

jest.mock('expo-notifications', () => ({
  SchedulableTriggerInputTypes: { DAILY: 'daily', WEEKLY: 'weekly' },
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  cancelAllScheduledNotificationsAsync: jest.fn(async () => undefined),
  scheduleNotificationAsync: jest.fn(async () => 'scheduled-id'),
}));

const getPermissions = Notifications.getPermissionsAsync as jest.Mock;
const requestPermissions = Notifications.requestPermissionsAsync as jest.Mock;
const cancelAll =
  Notifications.cancelAllScheduledNotificationsAsync as jest.Mock;

jest.setTimeout(20000);

beforeEach(() => {
  getPermissions.mockReset();
  requestPermissions.mockReset();
  cancelAll.mockClear();
  useNotificationStore.setState({
    prefs: { ...DEFAULT_PREFS },
    permission: 'undetermined',
    hydrated: true,
  });
});

describe('NotificationSettings', () => {
  it('requests permission contextually only when the person enables reminders', () => {
    render(<NotificationSettings />);
    // No cold prompt on mount.
    expect(requestPermissions).not.toHaveBeenCalled();
  });

  it('turns reminders on and reveals the schedule when permission is granted', async () => {
    getPermissions.mockResolvedValue({
      status: 'undetermined',
      granted: false,
      canAskAgain: true,
    });
    requestPermissions.mockResolvedValue({
      status: 'granted',
      granted: true,
      canAskAgain: false,
    });

    render(<NotificationSettings />);
    fireEvent.press(screen.getByRole('switch', { name: copy.toggleLabel }));

    await waitFor(() => expect(requestPermissions).toHaveBeenCalledTimes(1));
    await waitFor(() =>
      expect(screen.getByText(copy.scheduleTitle)).toBeOnTheScreen(),
    );
    expect(useNotificationStore.getState().prefs.enabled).toBe(true);
  });

  it('explains gently and stays off when permission is denied', async () => {
    getPermissions.mockResolvedValue({
      status: 'undetermined',
      granted: false,
      canAskAgain: true,
    });
    requestPermissions.mockResolvedValue({
      status: 'denied',
      granted: false,
      canAskAgain: false,
    });

    render(<NotificationSettings />);
    fireEvent.press(screen.getByRole('switch', { name: copy.toggleLabel }));

    await waitFor(() =>
      expect(screen.getByText(copy.deniedTitle)).toBeOnTheScreen(),
    );
    expect(useNotificationStore.getState().prefs.enabled).toBe(false);
  });

  it('offers a clear disable that cancels scheduled reminders', async () => {
    useNotificationStore.setState({
      prefs: { ...DEFAULT_PREFS, enabled: true },
      permission: 'granted',
      hydrated: true,
    });

    render(<NotificationSettings />);
    fireEvent.press(screen.getByRole('button', { name: copy.disableLabel }));

    await waitFor(() => expect(cancelAll).toHaveBeenCalled());
    expect(useNotificationStore.getState().prefs.enabled).toBe(false);
    await waitFor(() =>
      expect(screen.getByText(copy.disabledConfirmation)).toBeOnTheScreen(),
    );
  });

  it('shows a gentle loading state until preferences hydrate', () => {
    useNotificationStore.setState({
      prefs: { ...DEFAULT_PREFS },
      permission: 'undetermined',
      hydrated: false,
    });
    render(<NotificationSettings />);
    expect(screen.getByLabelText(copy.loadingLabel)).toBeOnTheScreen();
  });
});
