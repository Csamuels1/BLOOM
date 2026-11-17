import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import {
  DEFAULT_PREFS,
  normalizeWeekdays,
  clampTime,
  type NotificationPrefs,
  type TimeOfDay,
  type Weekday,
} from './notificationPrefs';
import {
  getPermissionStatus,
  requestPermission,
  type PermissionStatus,
} from './permissions';
import { applySchedule, cancelAllReminders } from './scheduling';

/**
 * Reminder-preferences store (issue #36).
 *
 * Persists ONLY the preferences (not permission state or methods) to
 * AsyncStorage, so a returning person keeps their chosen days/time. Permission
 * is requested contextually — only via `enable()`, when the person opts in.
 * Disabling is immediate and cancels everything scheduled.
 *
 * All AsyncStorage access goes through zustand's persist middleware, which
 * tolerates read/write failures; the store renders correctly from DEFAULT_PREFS
 * when storage is empty or unavailable.
 */
export const NOTIFICATION_STORAGE_KEY = 'bloom-notification-prefs';

interface NotificationState {
  prefs: NotificationPrefs;
  /** Last-known OS permission status. Never persisted (the OS is the source). */
  permission: PermissionStatus;
  /** True once the persisted preferences (if any) have been rehydrated. */
  hydrated: boolean;

  /**
   * Opt into reminders. Requests notification permission CONTEXTUALLY, and only
   * on a grant turns reminders on and schedules them. On denial, reminders stay
   * off and the permission status is recorded so the UI can explain gently.
   * Resolves true only when reminders are now on.
   */
  enable: () => Promise<boolean>;
  /** Turn reminders off immediately and cancel everything scheduled. */
  disable: () => Promise<void>;
  /** Change the reminder time; reschedules if reminders are on. */
  setTime: (time: TimeOfDay) => Promise<void>;
  /** Add/remove a weekday; reschedules if reminders are on. */
  toggleWeekday: (weekday: Weekday) => Promise<void>;
  /** Re-read the OS permission status without prompting. */
  refreshPermission: () => Promise<void>;
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      prefs: { ...DEFAULT_PREFS },
      permission: 'undetermined',
      hydrated: false,

      enable: async () => {
        const result = await requestPermission();
        set({ permission: result.status });
        if (!result.granted) {
          // Keep reminders off; nothing is scheduled, nothing crashes.
          set((state) => ({ prefs: { ...state.prefs, enabled: false } }));
          return false;
        }
        const prefs: NotificationPrefs = { ...get().prefs, enabled: true };
        set({ prefs });
        await applySchedule(prefs);
        return true;
      },

      disable: async () => {
        set((state) => ({ prefs: { ...state.prefs, enabled: false } }));
        await cancelAllReminders();
      },

      setTime: async (time) => {
        const prefs: NotificationPrefs = {
          ...get().prefs,
          time: clampTime(time),
        };
        set({ prefs });
        if (prefs.enabled) await applySchedule(prefs);
      },

      toggleWeekday: async (weekday) => {
        const current = get().prefs;
        const next = current.weekdays.includes(weekday)
          ? current.weekdays.filter((day) => day !== weekday)
          : [...current.weekdays, weekday];
        const prefs: NotificationPrefs = {
          ...current,
          weekdays: normalizeWeekdays(next),
        };
        set({ prefs });
        if (prefs.enabled) await applySchedule(prefs);
      },

      refreshPermission: async () => {
        const result = await getPermissionStatus();
        set({ permission: result.status });
      },
    }),
    {
      name: NOTIFICATION_STORAGE_KEY,
      storage: createJSONStorage(() => AsyncStorage),
      // Persist only the preferences — never permission state or the methods.
      partialize: (state) => ({ prefs: state.prefs }),
      onRehydrateStorage: () => (state) => {
        if (state) state.hydrated = true;
      },
    },
  ),
);
