import { fireEvent, render, screen } from '@testing-library/react-native';

import { onboardingCopy as copy } from '@/content/onboarding';
import { useOnboardingStore } from '@/features/onboarding/onboardingStore';
import { WelcomeStep } from '@/features/onboarding/screens/WelcomeStep';

beforeEach(() => {
  useOnboardingStore.setState({
    draft: {},
    currentStepId: 'welcome',
    hydrated: false,
  });
});

describe('WelcomeStep', () => {
  it('shows the approved brand name and tagline', () => {
    render(<WelcomeStep />);
    expect(screen.getByRole('header', { name: 'BLOOM' })).toBeOnTheScreen();
    expect(screen.getByText(copy.welcomeTagline)).toBeOnTheScreen();
  });

  it('advances to the goal step on begin', () => {
    render(<WelcomeStep />);
    fireEvent.press(screen.getByRole('button', { name: copy.welcomeBegin }));
    expect(useOnboardingStore.getState().currentStepId).toBe('goal');
  });
});
