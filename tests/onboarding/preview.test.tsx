import { fireEvent, render, screen } from '@testing-library/react-native';

import { onboardingCopy as copy } from '@/content/onboarding';
import { useOnboardingStore } from '@/features/onboarding/onboardingStore';
import { PreviewStep } from '@/features/onboarding/screens/PreviewStep';

const mockReplace = jest.fn();
jest.mock('expo-router', () => ({
  router: { replace: (...args: unknown[]) => mockReplace(...args) },
}));

beforeEach(() => {
  mockReplace.mockClear();
  useOnboardingStore.setState({
    draft: {
      isPregnant: false,
      goal: 'maintenance',
      countryCode: 'NG',
      unitSystem: 'metric',
    },
    currentStepId: 'preview',
    hydrated: false,
  });
});

describe('PreviewStep', () => {
  it('summarizes the chosen goal, region, and units', () => {
    render(<PreviewStep />);
    expect(screen.getByText(copy.goalMaintainTitle)).toBeOnTheScreen();
    expect(screen.getByText(copy.countryNigeria)).toBeOnTheScreen();
    expect(screen.getByText(copy.unitMetric)).toBeOnTheScreen();
  });

  it('finishes onboarding by returning to the app', () => {
    render(<PreviewStep />);
    fireEvent.press(screen.getByRole('button', { name: copy.previewFinish }));
    expect(mockReplace).toHaveBeenCalledWith('/');
  });
});
