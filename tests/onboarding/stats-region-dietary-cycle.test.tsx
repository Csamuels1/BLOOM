import { fireEvent, render, screen } from '@testing-library/react-native';

import { onboardingCopy as copy } from '@/content/onboarding';
import { useOnboardingStore } from '@/features/onboarding/onboardingStore';
import { CycleStep } from '@/features/onboarding/screens/CycleStep';
import { DietaryAllergensStep } from '@/features/onboarding/screens/DietaryAllergensStep';
import { RegionUnitsStep } from '@/features/onboarding/screens/RegionUnitsStep';
import { StatsStep } from '@/features/onboarding/screens/StatsStep';
import type { OnboardingDraft } from '@/features/onboarding/schema';
import type { OnboardingStepId } from '@/features/onboarding/steps';

function reset(currentStepId: OnboardingStepId, draft: OnboardingDraft = {}) {
  useOnboardingStore.setState({ draft, currentStepId, hydrated: false });
}

describe('StatsStep', () => {
  beforeEach(() => reset('stats', { isPregnant: false }));

  it('records a valid height and advances', () => {
    render(<StatsStep />);
    fireEvent.changeText(screen.getByLabelText(copy.heightLabel), '165');
    fireEvent.press(screen.getByRole('button', { name: copy.continue }));

    expect(useOnboardingStore.getState().draft.heightCm).toBe(165);
    expect(useOnboardingStore.getState().currentStepId).toBe('region-units');
  });

  it('rejects an out-of-range height', () => {
    render(<StatsStep />);
    fireEvent.changeText(screen.getByLabelText(copy.heightLabel), '300');
    fireEvent.press(screen.getByRole('button', { name: copy.continue }));

    expect(screen.getByText(copy.errHeightRange)).toBeOnTheScreen();
    expect(useOnboardingStore.getState().draft.heightCm).toBeUndefined();
    expect(useOnboardingStore.getState().currentStepId).toBe('stats');
  });
});

describe('RegionUnitsStep', () => {
  beforeEach(() => reset('region-units', { isPregnant: false }));

  it('defaults region and units from the device locale (no GPS)', () => {
    render(<RegionUnitsStep />);
    // jest-setup mocks a Nigeria / metric locale.
    expect(
      screen.getByRole('radio', { name: copy.countryNigeria }).props
        .accessibilityState.selected,
    ).toBe(true);
    expect(
      screen.getByRole('radio', { name: copy.unitMetric }).props
        .accessibilityState.selected,
    ).toBe(true);
  });

  it('lets the locale default be overridden', () => {
    render(<RegionUnitsStep />);
    fireEvent.press(
      screen.getByRole('radio', { name: copy.countryUnitedStates }),
    );
    fireEvent.press(screen.getByRole('button', { name: copy.continue }));

    expect(useOnboardingStore.getState().draft.countryCode).toBe('US');
    expect(useOnboardingStore.getState().draft.unitSystem).toBe('metric');
    expect(useOnboardingStore.getState().currentStepId).toBe(
      'dietary-allergens',
    );
  });
});

describe('DietaryAllergensStep', () => {
  beforeEach(() => reset('dietary-allergens', { isPregnant: false }));

  it('shows the allergen disclaimer', () => {
    render(<DietaryAllergensStep />);
    expect(screen.getByText(copy.allergenDisclaimer)).toBeOnTheScreen();
  });

  it('records multi-selected allergens and advances (empty is allowed too)', () => {
    render(<DietaryAllergensStep />);
    fireEvent.press(
      screen.getByRole('checkbox', { name: copy.allergenPeanut }),
    );
    fireEvent.press(screen.getByRole('checkbox', { name: copy.allergenMilk }));
    fireEvent.press(screen.getByRole('button', { name: copy.continue }));

    expect(useOnboardingStore.getState().draft.allergens).toEqual([
      'peanut',
      'milk',
    ]);
    expect(useOnboardingStore.getState().currentStepId).toBe('cycle');
  });
});

describe('CycleStep (optional)', () => {
  beforeEach(() => reset('cycle', { isPregnant: false }));

  it('records a cycle preference and advances to the preview', () => {
    render(<CycleStep />);
    fireEvent.press(screen.getByRole('radio', { name: copy.cycleYes }));
    fireEvent.press(screen.getByRole('button', { name: copy.continue }));

    expect(useOnboardingStore.getState().draft.trackCycle).toBe(true);
    expect(useOnboardingStore.getState().currentStepId).toBe('preview');
  });
});
