import { fireEvent, render, screen } from '@testing-library/react-native';

import { onboardingCopy as copy } from '@/content/onboarding';
import { useOnboardingStore } from '@/features/onboarding/onboardingStore';
import { GoalStep } from '@/features/onboarding/screens/GoalStep';

beforeEach(() => {
  useOnboardingStore.setState({
    draft: {},
    currentStepId: 'goal',
    hydrated: false,
  });
});

describe('GoalStep', () => {
  it('offers three equal goal choices as a radio group', () => {
    render(<GoalStep />);
    expect(screen.getAllByRole('radio')).toHaveLength(3);
    expect(screen.getByText(copy.goalLossTitle)).toBeOnTheScreen();
    expect(screen.getByText(copy.goalMaintainTitle)).toBeOnTheScreen();
    expect(screen.getByText(copy.goalGainTitle)).toBeOnTheScreen();
  });

  it('shows no BMI or scale framing', () => {
    render(<GoalStep />);
    expect(screen.queryByText(/bmi/i)).toBeNull();
    expect(screen.queryByText(/scale|weigh-in|pounds|kilograms/i)).toBeNull();
  });

  it('cannot continue until a goal is chosen', () => {
    render(<GoalStep />);
    fireEvent.press(screen.getByRole('button', { name: copy.goalContinue }));
    // Nothing selected: no patch and no advance.
    expect(useOnboardingStore.getState().draft.goal).toBeUndefined();
    expect(useOnboardingStore.getState().currentStepId).toBe('goal');
  });

  it('records the chosen goal and advances', () => {
    render(<GoalStep />);
    fireEvent.press(screen.getByRole('radio', { name: copy.goalLossTitle }));
    fireEvent.press(screen.getByRole('button', { name: copy.goalContinue }));

    expect(useOnboardingStore.getState().draft.goal).toBe('loss');
    expect(useOnboardingStore.getState().currentStepId).toBe('pregnancy');
  });

  it('pre-selects a goal already in the draft (resume)', () => {
    useOnboardingStore.setState({
      draft: { goal: 'gain' },
      currentStepId: 'goal',
      hydrated: false,
    });
    render(<GoalStep />);
    expect(
      screen.getByRole('radio', { name: copy.goalGainTitle }).props
        .accessibilityState.selected,
    ).toBe(true);
  });
});
