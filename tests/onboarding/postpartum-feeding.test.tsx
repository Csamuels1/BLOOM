import { fireEvent, render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { onboardingCopy as copy } from '@/content/onboarding';
import { OnboardingFlow } from '@/features/onboarding/OnboardingFlow';
import { useOnboardingStore } from '@/features/onboarding/onboardingStore';
import { FeedingStep } from '@/features/onboarding/screens/FeedingStep';
import { PostpartumMonthsStep } from '@/features/onboarding/screens/PostpartumMonthsStep';
import { PostpartumStep } from '@/features/onboarding/screens/PostpartumStep';
import type { OnboardingDraft } from '@/features/onboarding/schema';
import type { OnboardingStepId } from '@/features/onboarding/steps';

function reset(currentStepId: OnboardingStepId, draft: OnboardingDraft = {}) {
  useOnboardingStore.setState({ draft, currentStepId, hydrated: false });
}

function renderFlow() {
  return render(
    <SafeAreaProvider
      initialMetrics={{
        insets: { top: 0, left: 0, right: 0, bottom: 0 },
        frame: { x: 0, y: 0, width: 400, height: 800 },
      }}
    >
      <OnboardingFlow />
    </SafeAreaProvider>,
  );
}

describe('PostpartumStep (conditional)', () => {
  beforeEach(() => reset('postpartum', { isPregnant: false }));

  it('reveals the months step only for a postpartum answer', () => {
    render(<PostpartumStep />);
    fireEvent.press(screen.getByRole('radio', { name: copy.postpartumYes }));
    fireEvent.press(screen.getByRole('button', { name: copy.continue }));

    expect(useOnboardingStore.getState().draft.postpartumStatus).toBe(
      'postpartum',
    );
    expect(useOnboardingStore.getState().currentStepId).toBe(
      'postpartum-months',
    );
  });

  it('skips the months step when not postpartum', () => {
    render(<PostpartumStep />);
    fireEvent.press(screen.getByRole('radio', { name: copy.postpartumNo }));
    fireEvent.press(screen.getByRole('button', { name: copy.continue }));

    expect(useOnboardingStore.getState().currentStepId).toBe('stats');
  });

  it('keeps prefer-not-to-say usable', () => {
    render(<PostpartumStep />);
    fireEvent.press(
      screen.getByRole('radio', { name: copy.postpartumPreferNot }),
    );
    fireEvent.press(screen.getByRole('button', { name: copy.continue }));

    expect(useOnboardingStore.getState().draft.postpartumStatus).toBe(
      'prefer_not_to_say',
    );
    expect(useOnboardingStore.getState().currentStepId).toBe('stats');
  });
});

describe('PostpartumMonthsStep', () => {
  beforeEach(() =>
    reset('postpartum-months', {
      isPregnant: false,
      postpartumStatus: 'postpartum',
    }),
  );

  it('steps the month count and records it', () => {
    render(<PostpartumMonthsStep />);
    fireEvent.press(screen.getByRole('button', { name: copy.monthsIncrease }));
    fireEvent.press(screen.getByRole('button', { name: copy.continue }));

    // Default 3 + one increase = 4.
    expect(useOnboardingStore.getState().draft.postpartumMonths).toBe(4);
    expect(useOnboardingStore.getState().currentStepId).toBe('feeding');
  });
});

describe('FeedingStep (optional)', () => {
  beforeEach(() =>
    reset('feeding', { isPregnant: false, postpartumStatus: 'postpartum' }),
  );

  it('records a feeding choice, including prefer-not-to-say', () => {
    render(<FeedingStep />);
    fireEvent.press(screen.getByRole('radio', { name: copy.feedingPreferNot }));
    fireEvent.press(screen.getByRole('button', { name: copy.continue }));

    expect(useOnboardingStore.getState().draft.feedingContext).toBe(
      'prefer_not_to_say',
    );
    expect(useOnboardingStore.getState().currentStepId).toBe('stats');
  });

  it('can be skipped without entering data (optional step)', () => {
    reset('feeding', { isPregnant: false, postpartumStatus: 'postpartum' });
    renderFlow();

    fireEvent.press(screen.getByRole('button', { name: copy.skip }));

    expect(useOnboardingStore.getState().draft.feedingContext).toBeUndefined();
    expect(useOnboardingStore.getState().currentStepId).toBe('stats');
  });

  it('does not offer skip on a required step', () => {
    reset('postpartum', { isPregnant: false });
    renderFlow();
    expect(screen.queryByRole('button', { name: copy.skip })).toBeNull();
  });
});
