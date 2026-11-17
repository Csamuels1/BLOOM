import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';

import {
  useNotificationStore,
  NOTIFICATION_STORAGE_KEY,
} from '@/features/notifications/notificationStore';
import { DEFAULT_PREFS } from '@/features/notifications/notificationPrefs';

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
const schedule = Notifications.scheduleNotificationAsync as jest.Mock;

function grant(): void {
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
}

function deny(): void {
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
}

/** Let zustand's persist middleware flush its async write. */
async function flush(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 0));
}

async function persistedPrefs(): Promise<{ enabled: boolean } | null> {
  const raw = await AsyncStorage.getItem(NOTIFICATION_STORAGE_KEY);
  if (!raw) return null;
  const parsed = JSON.parse(raw) as {
    state?: { prefs?: { enabled: boolean } };
  };
  return parsed.state?.prefs ?? null;
}

beforeEach(async () => {
  getPermissions.mockReset();
  requestPermissions.mockReset();
  cancelAll.mockClear();
  schedule.mockClear();
  await AsyncStorage.clear();
  useNotificationStore.setState({
    prefs: { ...DEFAULT_PREFS },
    permission: 'undetermined',
    hydrated: true,
  });
});

describe('enable (contextual permission)', () => {
  it('requests permission and, on grant, turns reminders on and schedules', async () => {
    grant();

    const ok = await useNotificationStore.getState().enable();

    expect(ok).toBe(true);
    expect(requestPermissions).toHaveBeenCalledTimes(1);
    const state = useNotificationStore.getState();
    expect(state.prefs.enabled).toBe(true);
    expect(state.permission).toBe('granted');
    expect(schedule).toHaveBeenCalled();
  });

  it('persists the enabled preference to AsyncStorage', async () => {
    grant();
    await useNotificationStore.getState().enable();
    await flush();
    expect(await persistedPrefs()).toMatchObject({ enabled: true });
  });

  it('keeps reminders off and schedules nothing when permission is denied', async () => {
    deny();

    const ok = await useNotificationStore.getState().enable();

    expect(ok).toBe(false);
    const state = useNotificationStore.getState();
    expect(state.prefs.enabled).toBe(false);
    expect(state.permission).toBe('denied');
    expect(schedule).not.toHaveBeenCalled();
  });
});

describe('disable', () => {
  it('turns reminders off immediately and cancels everything scheduled', async () => {
    useNotificationStore.setState({
      prefs: { ...DEFAULT_PREFS, enabled: true },
      permission: 'granted',
      hydrated: true,
    });

    await useNotificationStore.getState().disable();

    expect(useNotificationStore.getState().prefs.enabled).toBe(false);
    expect(cancelAll).toHaveBeenCalled();
    await flush();
    expect(await persistedPrefs()).toMatchObject({ enabled: false });
  });
});

describe('schedule changes', () => {
  it('toggling a weekday while enabled reschedules', async () => {
    useNotificationStore.setState({
      prefs: { ...DEFAULT_PREFS, enabled: true },
      permission: 'granted',
      hydrated: true,
    });

    await useNotificationStore.getState().toggleWeekday(3);

    expect(useNotificationStore.getState().prefs.weekdays).not.toContain(3);
    // Rescheduled: cancel + schedule for the remaining six days.
    expect(cancelAll).toHaveBeenCalled();
    expect(schedule).toHaveBeenCalled();
  });

  it('changing time while disabled updates prefs but schedules nothing', async () => {
    await useNotificationStore.getState().setTime({ hour: 7, minute: 45 });

    expect(useNotificationStore.getState().prefs.time).toEqual({
      hour: 7,
      minute: 45,
    });
    expect(schedule).not.toHaveBeenCalled();
    await flush();
    const prefs = (await persistedPrefs()) as { time?: unknown } | null;
    expect(prefs).toMatchObject({ time: { hour: 7, minute: 45 } });
  });
});
