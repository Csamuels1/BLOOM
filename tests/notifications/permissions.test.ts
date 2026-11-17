import * as Notifications from 'expo-notifications';

import {
  getPermissionStatus,
  requestPermission,
} from '@/features/notifications/permissions';

jest.mock('expo-notifications', () => ({
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
}));

const getPermissions = Notifications.getPermissionsAsync as jest.Mock;
const requestPermissions = Notifications.requestPermissionsAsync as jest.Mock;

beforeEach(() => {
  getPermissions.mockReset();
  requestPermissions.mockReset();
});

describe('requestPermission (contextual)', () => {
  it('prompts when permission is undetermined and reports the result', async () => {
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

    const result = await requestPermission();

    expect(requestPermissions).toHaveBeenCalledTimes(1);
    expect(result.granted).toBe(true);
    expect(result.status).toBe('granted');
  });

  it('does not prompt again when permission is already granted', async () => {
    getPermissions.mockResolvedValue({
      status: 'granted',
      granted: true,
      canAskAgain: false,
    });

    const result = await requestPermission();

    expect(requestPermissions).not.toHaveBeenCalled();
    expect(result.granted).toBe(true);
  });

  it('does not prompt when permission was permanently denied, and reports denial', async () => {
    getPermissions.mockResolvedValue({
      status: 'denied',
      granted: false,
      canAskAgain: false,
    });

    const result = await requestPermission();

    expect(requestPermissions).not.toHaveBeenCalled();
    expect(result.granted).toBe(false);
    expect(result.status).toBe('denied');
  });

  it('handles denial from the prompt gracefully', async () => {
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

    const result = await requestPermission();

    expect(result.granted).toBe(false);
    expect(result.status).toBe('denied');
  });

  it('never throws when the native module rejects', async () => {
    getPermissions.mockRejectedValue(new Error('no native module'));

    const result = await requestPermission();

    expect(result.granted).toBe(false);
  });
});

describe('getPermissionStatus', () => {
  it('reads status without ever prompting', async () => {
    getPermissions.mockResolvedValue({
      status: 'undetermined',
      granted: false,
      canAskAgain: true,
    });

    const result = await getPermissionStatus();

    expect(requestPermissions).not.toHaveBeenCalled();
    expect(result.status).toBe('undetermined');
  });
});
