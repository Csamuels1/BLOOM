import * as Notifications from 'expo-notifications';

/**
 * Contextual notification-permission helpers (issue #36).
 *
 * PRIVACY/UX: permission is requested ONLY at the moment the person opts into
 * reminders — never a cold upfront prompt. Denial is tolerated gracefully: the
 * app keeps working and reminders simply stay off.
 */

export type PermissionStatus = 'granted' | 'denied' | 'undetermined';

export interface PermissionResult {
  status: PermissionStatus;
  granted: boolean;
  /** Whether the OS still allows us to prompt (false once permanently denied). */
  canAskAgain: boolean;
}

interface RawPermission {
  status?: string;
  granted?: boolean;
  canAskAgain?: boolean;
}

function toStatus(raw: RawPermission): PermissionStatus {
  if (raw.granted === true || raw.status === 'granted') return 'granted';
  if (raw.status === 'denied') return 'denied';
  return 'undetermined';
}

function normalize(raw: RawPermission): PermissionResult {
  const status = toStatus(raw);
  return {
    status,
    granted: status === 'granted',
    canAskAgain: raw.canAskAgain ?? status !== 'denied',
  };
}

/** Read the current permission without prompting. Crash-safe. */
export async function getPermissionStatus(): Promise<PermissionResult> {
  try {
    const current = await Notifications.getPermissionsAsync();
    return normalize(current);
  } catch {
    return { status: 'undetermined', granted: false, canAskAgain: true };
  }
}

/**
 * Contextually request permission. Call this only when the person has chosen to
 * enable reminders. If permission is already granted we skip the prompt; if it
 * was permanently denied we return that without prompting again. Any failure is
 * treated as "not granted" so the caller can keep reminders off gracefully.
 */
export async function requestPermission(): Promise<PermissionResult> {
  try {
    const current = normalize(await Notifications.getPermissionsAsync());
    if (current.granted) return current;
    if (!current.canAskAgain) return current;

    return normalize(await Notifications.requestPermissionsAsync());
  } catch {
    return { status: 'denied', granted: false, canAskAgain: false };
  }
}
