import { render, screen } from '@testing-library/react-native';

import { EmptyState } from '@/components/EmptyState';
import { ILLUSTRATION_NAMES, Illustration } from '@/components/Illustration';
import { WelcomeStep } from '@/features/onboarding/screens/WelcomeStep';

jest.mock('@/design/useReducedMotion', () => ({
  useReducedMotion: () => true,
}));

// The first jest-expo render in a suite pays a one-time warm-up.
jest.setTimeout(20000);

describe('Illustration', () => {
  it.each(ILLUSTRATION_NAMES)('renders the %s art', (name) => {
    render(<Illustration name={name} size={64} />);
    const art = screen.getByTestId(`illustration-${name}`, {
      includeHiddenElements: true,
    });
    expect(art).toHaveStyle({ width: 64, height: 64 });
  });

  it('is decorative and hidden from assistive tech', () => {
    render(<Illustration name="sprout" />);
    expect(screen.queryByTestId('illustration-sprout')).toBeNull();
    const art = screen.getByTestId('illustration-sprout', {
      includeHiddenElements: true,
    });
    expect(art.props.importantForAccessibility).toBe('no-hide-descendants');
    expect(art.props.accessibilityElementsHidden).toBe(true);
  });

  it('renders without the entrance wrapper when not animated', () => {
    render(<Illustration name="moon" animated={false} />);
    expect(
      screen.getByTestId('illustration-moon', { includeHiddenElements: true }),
    ).toBeTruthy();
  });
});

describe('EmptyState illustration', () => {
  it('shows the requested art above the invitation', () => {
    render(<EmptyState title="Nothing yet" illustration="leaves" />);
    expect(screen.getByText('Nothing yet')).toBeOnTheScreen();
    expect(
      screen.getByTestId('illustration-leaves', {
        includeHiddenElements: true,
      }),
    ).toBeTruthy();
  });

  it('stays text-only when no art is requested', () => {
    render(<EmptyState title="Nothing yet" />);
    for (const name of ILLUSTRATION_NAMES) {
      expect(
        screen.queryByTestId(`illustration-${name}`, {
          includeHiddenElements: true,
        }),
      ).toBeNull();
    }
  });
});

describe('WelcomeStep art', () => {
  it('replaces the plain welcome with the blossom illustration', () => {
    render(<WelcomeStep />);
    expect(
      screen.getByTestId('illustration-blossom', {
        includeHiddenElements: true,
      }),
    ).toBeTruthy();
  });
});
