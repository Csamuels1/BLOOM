import { render, screen } from '@testing-library/react-native';

import { SafetyNotice } from '@/components/SafetyNotice';

describe('SafetyNotice', () => {
  it('announces as an alert with the title and message', () => {
    render(
      <SafetyNotice
        title="Let's pause here"
        message="If things feel hard right now, here are people who can help."
      />,
    );
    const alert = screen.getByRole('alert');
    expect(alert.props.accessibilityLabel).toContain("Let's pause here");
    expect(alert.props.accessibilityLabel).toContain('people who can help');
  });

  it('renders the title and message text', () => {
    render(
      <SafetyNotice title="A gentle note" message="You are not behind." />,
    );
    expect(screen.getByText('A gentle note')).toBeOnTheScreen();
    expect(screen.getByText('You are not behind.')).toBeOnTheScreen();
  });
});
