import { fireEvent, render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { onboardingCopy as copy } from '@/content/onboarding';
import { OnboardingFlow } from '@/features/onboarding/OnboardingFlow';
import { useOnboardingStore } from '@/features/onboarding/onboardingStore';

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
  useOnboardingStore.setState({
    draft: {},
    currentStepId: 'welcome',
    hydrated: false,
  });
});

describe('OnboardingFlow host', () => {
  it('renders the current step with progress and no Back on the first step', () => {
    renderFlow();
    expect(screen.getByRole('header', { name: 'BLOOM' })).toBeOnTheScreen();
    expect(screen.getByText(/^Step 1 of/)).toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: copy.back })).toBeNull();
  });

  it('moves forward and back through the flow', () => {
    renderFlow();
    fireEvent.press(screen.getByRole('button', { name: copy.welcomeBegin }));

    expect(screen.getByText(copy.goalHeading)).toBeOnTheScreen();
    const backButton = screen.getByRole('button', { name: copy.back });
    expect(backButton).toBeOnTheScreen();

    fireEvent.press(backButton);
    expect(screen.getByRole('header', { name: 'BLOOM' })).toBeOnTheScreen();
  });
});
