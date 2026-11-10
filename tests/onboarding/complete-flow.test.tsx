import { fireEvent, render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { onboardingCopy as copy } from '@/content/onboarding';
import { OnboardingFlow } from '@/features/onboarding/OnboardingFlow';
import { useOnboardingStore } from '@/features/onboarding/onboardingStore';

const mockReplace = jest.fn();
jest.mock('expo-router', () => ({
  router: { replace: (...args: unknown[]) => mockReplace(...args) },
}));

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

beforeEach(() => {
  mockReplace.mockClear();
  useOnboardingStore.setState({
    draft: {},
    currentStepId: 'welcome',
    hydrated: false,
  });
});

const pressButton = (name: string) =>
  fireEvent.press(screen.getByRole('button', { name }));
const pressRadio = (name: string) =>
  fireEvent.press(screen.getByRole('radio', { name }));

describe('complete onboarding flow (no backend)', () => {
  it('walks a non-pregnant user from welcome to the plan reveal and finishes', () => {
    renderFlow();

    // Welcome -> goal
    pressButton(copy.welcomeBegin);
    // Goal -> pregnancy
    pressRadio(copy.goalMaintainTitle);
    pressButton(copy.continue);
    // Pregnancy (No) -> postpartum
    pressRadio(copy.pregnancyNo);
    pressButton(copy.continue);
    // Postpartum (not right now) -> stats (months/feeding skipped)
    pressRadio(copy.postpartumNo);
    pressButton(copy.continue);
    // Stats -> region/units
    fireEvent.changeText(screen.getByLabelText(copy.heightLabel), '165');
    pressButton(copy.continue);
    // Region/units (locale-defaulted) -> dietary/allergens
    pressButton(copy.continue);
    // Dietary/allergens (empty is allowed) -> cycle
    pressButton(copy.continue);
    // Cycle is optional: skip -> plan reveal
    pressButton(copy.skip);

    // Plan reveal: narrative, range, meals, CTA.
    expect(screen.getByText(copy.planNarrative)).toBeOnTheScreen();
    expect(screen.getByText(copy.planRange)).toBeOnTheScreen();
    // Region defaulted to the mocked NG locale, so meals are Nigerian.
    expect(screen.getByText(copy.mealNigeria1)).toBeOnTheScreen();

    pressButton(copy.planCta);
    expect(mockReplace).toHaveBeenCalledWith('/');

    // The whole walkthrough collected data locally only.
    const { draft } = useOnboardingStore.getState();
    expect(draft).toMatchObject({
      goal: 'maintenance',
      isPregnant: false,
      postpartumStatus: 'not_postpartum',
      heightCm: 165,
    });
  });
});
