import { act, renderHook } from '@testing-library/react-native';
import { z } from 'zod';

import { useOnboardingStore } from '@/features/onboarding/onboardingStore';
import { GOALS } from '@/features/onboarding/schema';
import { useOnboardingForm } from '@/features/onboarding/useOnboardingForm';

const goalSchema = z.object({ goal: z.enum(GOALS) });

beforeEach(() => {
  useOnboardingStore.setState({
    draft: {},
    currentStepId: 'goal',
    hydrated: false,
  });
});

describe('useOnboardingForm', () => {
  it('patches the draft and advances on a valid submit', async () => {
    const { result } = renderHook(() => useOnboardingForm(goalSchema));

    act(() => result.current.form.setValue('goal', 'loss'));
    await act(async () => {
      result.current.submit();
    });

    expect(useOnboardingStore.getState().draft.goal).toBe('loss');
    expect(useOnboardingStore.getState().currentStepId).toBe('pregnancy');
  });

  it('does not patch or advance on an invalid submit', async () => {
    const { result } = renderHook(() => useOnboardingForm(goalSchema));

    await act(async () => {
      result.current.submit();
    });

    // Invalid submit neither patches the draft nor advances the step.
    expect(useOnboardingStore.getState().draft.goal).toBeUndefined();
    expect(useOnboardingStore.getState().currentStepId).toBe('goal');
  });

  it('can patch without advancing when advance is false', async () => {
    const { result } = renderHook(() =>
      useOnboardingForm(goalSchema, { advance: false }),
    );

    act(() => result.current.form.setValue('goal', 'gain'));
    await act(async () => {
      result.current.submit();
    });

    expect(useOnboardingStore.getState().draft.goal).toBe('gain');
    expect(useOnboardingStore.getState().currentStepId).toBe('goal');
  });
});
