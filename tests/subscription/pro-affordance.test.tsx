import { fireEvent, render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';

import { subscriptionCopy as copy } from '@/content/subscription';
import {
  ProAffordance,
  useTier,
  FREE_DAILY_MEAL_IDEAS,
} from '@/features/subscription';

jest.mock('@/design/useReducedMotion', () => ({
  useReducedMotion: () => false,
}));

function TierProbe() {
  return <Text>{useTier()}</Text>;
}

describe('entitlements', () => {
  it('treats everyone as Free until Phase 10 wires the real source', () => {
    expect(FREE_DAILY_MEAL_IDEAS).toBe(3);
    render(<TierProbe />);
    expect(screen.getByText('free')).toBeOnTheScreen();
  });
});

describe('ProAffordance', () => {
  it('presents Pro without pressure and is honest it is not purchasable yet', () => {
    render(<ProAffordance />);

    expect(screen.getByText(copy.proTitle)).toBeOnTheScreen();
    expect(screen.queryByText(copy.proComingSoon)).toBeNull();

    fireEvent.press(screen.getByRole('button', { name: copy.proCta }));
    expect(screen.getByText(copy.proComingSoon)).toBeOnTheScreen();
  });
});
