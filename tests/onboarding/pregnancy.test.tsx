import { fireEvent, render, screen } from '@testing-library/react-native';

import { onboardingCopy as copy } from '@/content/onboarding';
import { useOnboardingStore } from '@/features/onboarding/onboardingStore';
import { PregnancyBoundaryStep } from '@/features/onboarding/screens/PregnancyBoundaryStep';
import { PregnancyStep } from '@/features/onboarding/screens/PregnancyStep';
import type { OnboardingStepId } from '@/features/onboarding/steps';

function reset(currentStepId: OnboardingStepId, draft = {}) {
  useOnboardingStore.setState({ draft, currentStepId, hydrated: false });
}

describe('PregnancyStep', () => {
  beforeEach(() => reset('pregnancy'));

  it('routes a pregnant user to the care boundary', () => {
    render(<PregnancyStep />);
    fireEvent.press(screen.getByRole('radio', { name: copy.pregnancyYes }));
    fireEvent.press(screen.getByRole('button', { name: copy.continue }));

    expect(useOnboardingStore.getState().draft.isPregnant).toBe(true);
    expect(useOnboardingStore.getState().currentStepId).toBe(
      'pregnancy-boundary',
    );
  });

  it('continues a non-pregnant user to the postpartum question', () => {
    render(<PregnancyStep />);
    fireEvent.press(screen.getByRole('radio', { name: copy.pregnancyNo }));
    fireEvent.press(screen.getByRole('button', { name: copy.continue }));

    expect(useOnboardingStore.getState().draft.isPregnant).toBe(false);
    expect(useOnboardingStore.getState().currentStepId).toBe('postpartum');
  });
});

describe('PregnancyBoundaryStep', () => {
  beforeEach(() => reset('pregnancy-boundary', { isPregnant: true }));

  it('shows a care boundary and offers no weight or calorie plan', () => {
    render(<PregnancyBoundaryStep />);
    expect(screen.getByText(copy.boundaryBody)).toBeOnTheScreen();
    expect(screen.getByText(copy.boundaryResources)).toBeOnTheScreen();
    // No path forward into a plan — only going back to change the answer.
    expect(screen.queryByRole('button', { name: copy.continue })).toBeNull();
  });

  it('records that the boundary was shown', () => {
    render(<PregnancyBoundaryStep />);
    expect(
      useOnboardingStore.getState().draft.pregnancyBoundaryAcknowledged,
    ).toBe(true);
  });

  it('can go back to change the answer', () => {
    render(<PregnancyBoundaryStep />);
    fireEvent.press(screen.getByRole('button', { name: copy.boundaryChange }));
    expect(useOnboardingStore.getState().currentStepId).toBe('pregnancy');
  });
});
