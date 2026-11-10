import { fireEvent, render, screen } from '@testing-library/react-native';

import { onboardingCopy as copy } from '@/content/onboarding';
import { useOnboardingStore } from '@/features/onboarding/onboardingStore';
import { PreviewStep } from '@/features/onboarding/screens/PreviewStep';
import type { OnboardingDraft } from '@/features/onboarding/schema';

const mockReplace = jest.fn();
jest.mock('expo-router', () => ({
  router: { replace: (...args: unknown[]) => mockReplace(...args) },
}));

function setDraft(draft: OnboardingDraft) {
  useOnboardingStore.setState({
    draft,
    currentStepId: 'preview',
    hydrated: false,
  });
}

beforeEach(() => {
  mockReplace.mockClear();
  setDraft({
    isPregnant: false,
    goal: 'maintenance',
    countryCode: 'NG',
    unitSystem: 'metric',
  });
});

describe('PreviewStep plan reveal (#16)', () => {
  it('leads with narrative, not a number', () => {
    render(<PreviewStep />);
    const narrative = screen.getByText(copy.planNarrative);
    expect(narrative).toBeOnTheScreen();
    // The heading is narrative too, and the number lives further down.
    expect(screen.getByText(copy.planHeading)).toBeOnTheScreen();
  });

  it('shows calories as a range with a non-prescriptive note', () => {
    render(<PreviewStep />);
    expect(screen.getByText(copy.planRange)).toBeOnTheScreen();
    // A range, not a single number.
    expect(copy.planRange).toMatch(/\d[\s,0-9]*[–-][\s,0-9]*\d/);
    expect(screen.getByText(copy.planRangeNote)).toBeOnTheScreen();
  });

  it('renders three mock meals and a CTA', () => {
    render(<PreviewStep />);
    expect(screen.getByText(copy.mealNigeria1)).toBeOnTheScreen();
    expect(screen.getByText(copy.mealNigeria2)).toBeOnTheScreen();
    expect(screen.getByText(copy.mealNigeria3)).toBeOnTheScreen();
    expect(
      screen.getByRole('button', { name: copy.planCta }),
    ).toBeOnTheScreen();
  });

  it('shows general meals for non-Nigeria regions', () => {
    setDraft({ isPregnant: false, goal: 'loss', countryCode: 'US' });
    render(<PreviewStep />);
    expect(screen.getByText(copy.mealGeneral1)).toBeOnTheScreen();
    expect(screen.queryByText(copy.mealNigeria1)).toBeNull();
  });

  it('summarizes the chosen goal, region, and units', () => {
    render(<PreviewStep />);
    expect(screen.getByText(copy.goalMaintainTitle)).toBeOnTheScreen();
    expect(screen.getByText(copy.countryNigeria)).toBeOnTheScreen();
    expect(screen.getByText(copy.unitMetric)).toBeOnTheScreen();
  });

  it('finishes by returning to the app (no backend access)', () => {
    render(<PreviewStep />);
    fireEvent.press(screen.getByRole('button', { name: copy.planCta }));
    expect(mockReplace).toHaveBeenCalledWith('/');
  });
});
