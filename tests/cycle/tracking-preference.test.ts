import { act, renderHook } from '@testing-library/react-native';

import { useAuthStore } from '@/features/auth';
import { useTrackingPreference } from '@/features/cycle';
import { useProfileStore } from '@/features/profile';
import * as settingsService from '@/features/settings/settingsService';
import type { AppSupabaseClient } from '@/lib/supabase';

// Barrel re-exports are non-configurable, so mock the underlying module.
jest.mock('@/features/settings/settingsService', () => ({
  ...jest.requireActual('@/features/settings/settingsService'),
  saveTrackCycle: jest.fn(),
}));

const mockedSave = jest.mocked(settingsService.saveTrackCycle);
const client = {} as AppSupabaseClient;
const profile = { id: 'u1', track_cycle: true } as never;

beforeEach(() => {
  mockedSave.mockReset();
  useAuthStore.setState({ session: { user: { id: 'u1' } } } as never);
  useProfileStore.setState({ profile, status: 'loaded' } as never);
});

describe('useTrackingPreference', () => {
  it('adopts the value the server stored and updates the profile', async () => {
    mockedSave.mockResolvedValue({
      ok: true,
      value: { id: 'u1', track_cycle: false } as never,
    });
    const { result } = renderHook(() => useTrackingPreference(client));

    await act(async () => {
      await result.current.change(false);
    });

    expect(mockedSave).toHaveBeenCalledWith(client, 'u1', false);
    expect(result.current.tracking).toBe(false);
    expect(result.current.saveError).toBe(false);
    expect(useProfileStore.getState().profile?.track_cycle).toBe(false);
  });

  it('reverts and raises a visible error when the save fails (no silent failure)', async () => {
    mockedSave.mockResolvedValue({ ok: false });
    const { result } = renderHook(() => useTrackingPreference(client));

    await act(async () => {
      await result.current.change(false);
    });

    expect(result.current.tracking).toBe(true); // reverted
    expect(result.current.saveError).toBe(true);
    expect(useProfileStore.getState().profile?.track_cycle).toBe(true);
  });

  it('retries the last change', async () => {
    mockedSave.mockResolvedValueOnce({ ok: false }).mockResolvedValueOnce({
      ok: true,
      value: { id: 'u1', track_cycle: false } as never,
    });
    const { result } = renderHook(() => useTrackingPreference(client));

    await act(async () => {
      await result.current.change(false);
    });
    await act(async () => {
      await result.current.retry();
    });

    expect(mockedSave).toHaveBeenCalledTimes(2);
    expect(result.current.tracking).toBe(false);
    expect(result.current.saveError).toBe(false);
  });

  it('treats a missing session as a visible failure', async () => {
    useAuthStore.setState({ session: null } as never);
    const { result } = renderHook(() => useTrackingPreference(client));

    await act(async () => {
      await result.current.change(false);
    });

    expect(mockedSave).not.toHaveBeenCalled();
    expect(result.current.tracking).toBe(true);
    expect(result.current.saveError).toBe(true);
  });
});
