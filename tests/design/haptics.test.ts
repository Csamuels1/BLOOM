import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

import { confirmHaptic, haptics, selectionHaptic } from '@/design/haptics';

const impact = Haptics.impactAsync as jest.Mock;
const selection = Haptics.selectionAsync as jest.Mock;
const notification = Haptics.notificationAsync as jest.Mock;

const originalOS = Platform.OS;

function setOS(os: typeof Platform.OS) {
  Object.defineProperty(Platform, 'OS', { configurable: true, get: () => os });
}

afterEach(() => {
  setOS(originalOS);
  impact.mockImplementation(async () => undefined);
  selection.mockImplementation(async () => undefined);
});

describe('haptics utility', () => {
  it('confirms with a single light impact on native', () => {
    setOS('android');
    confirmHaptic();
    expect(impact).toHaveBeenCalledTimes(1);
    expect(impact).toHaveBeenCalledWith(Haptics.ImpactFeedbackStyle.Light);
  });

  it('offers a selection tick on native', () => {
    setOS('ios');
    selectionHaptic();
    expect(selection).toHaveBeenCalledTimes(1);
  });

  it('is a no-op on web', () => {
    setOS('web');
    confirmHaptic();
    selectionHaptic();
    expect(impact).not.toHaveBeenCalled();
    expect(selection).not.toHaveBeenCalled();
  });

  it('never throws when the native module throws synchronously', () => {
    setOS('android');
    impact.mockImplementation(() => {
      throw new Error('no haptic engine');
    });
    expect(() => confirmHaptic()).not.toThrow();
  });

  it('swallows a rejected haptic promise', async () => {
    setOS('android');
    const rejection = Promise.reject(new Error('disabled in settings'));
    selection.mockImplementation(() => rejection);
    expect(() => selectionHaptic()).not.toThrow();
    // The rejection is handled internally; awaiting it via the handler is safe.
    await expect(rejection.catch(() => 'handled')).resolves.toBe('handled');
  });

  it('exposes no error or warning haptics (never punish with feedback)', () => {
    expect(Object.keys(haptics).sort()).toEqual(['confirm', 'selection']);
    setOS('android');
    haptics.confirm();
    haptics.selection();
    expect(notification).not.toHaveBeenCalled();
  });
});
