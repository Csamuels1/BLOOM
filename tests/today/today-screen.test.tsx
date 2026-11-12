import { fireEvent, render, screen } from '@testing-library/react-native';

import { todayCopy as copy } from '@/content/today';
import { useProfileStore } from '@/features/profile';
import { TodayScreen } from '@/features/today';
import { mockMealsForRegion, type MockMeal } from '@/features/today/mockMeals';

// Deterministic motion (and no async act warnings from the accessibility read).
// jest.mock is hoisted above the imports by babel-plugin-jest-hoist.
jest.mock('@/design/useReducedMotion', () => ({
  useReducedMotion: () => false,
}));

/** First meal of a region, asserted present (the catalog always has three). */
function firstMeal(region: 'general' | 'nigeria'): MockMeal {
  const meal = mockMealsForRegion(region)[0];
  if (!meal) throw new Error('expected a mock meal');
  return meal;
}

function setRegion(countryCode: string | null) {
  useProfileStore.setState({
    profile: countryCode ? ({ country_code: countryCode } as never) : null,
    status: 'loaded',
  });
}

afterEach(() => {
  useProfileStore.setState({ profile: null, status: 'idle' });
});

describe('TodayScreen', () => {
  it('leads with a gentle overview, trend context, quick log, and meals', () => {
    setRegion(null);
    render(<TodayScreen />);

    expect(screen.getByText(copy.title)).toBeOnTheScreen();
    expect(screen.getByText(copy.intro)).toBeOnTheScreen();
    expect(screen.getByText(copy.trendTitle)).toBeOnTheScreen();
    expect(screen.getByText(copy.quickLogTitle)).toBeOnTheScreen();
    expect(screen.getByText(copy.mealsTitle)).toBeOnTheScreen();
  });

  it('shows three region-aware meals from the profile', () => {
    setRegion('NG');
    render(<TodayScreen />);

    for (const meal of mockMealsForRegion('nigeria')) {
      expect(screen.getByRole('button', { name: meal.name })).toBeOnTheScreen();
    }
  });

  it('keeps calories secondary as an approximate range, not a headline', () => {
    setRegion(null);
    render(<TodayScreen />);

    const first = firstMeal('general');
    expect(
      screen.getByText(
        `${copy.mealCaloriesLabel} ${first.calories.min}–${first.calories.max} ${copy.mealCaloriesUnit}`,
      ),
    ).toBeOnTheScreen();
  });

  it('expands a meal to reveal its ingredients only on tap', () => {
    setRegion(null);
    render(<TodayScreen />);

    const first = firstMeal('general');
    expect(screen.queryByText(first.ingredients)).toBeNull();

    fireEvent.press(screen.getByRole('button', { name: first.name }));
    expect(screen.getByText(first.ingredients)).toBeOnTheScreen();
  });

  it('shows an honest "coming soon" note when quick-log is used', () => {
    setRegion(null);
    render(<TodayScreen />);

    expect(screen.queryByText(copy.quickLogComingSoon)).toBeNull();
    fireEvent.press(screen.getByRole('button', { name: copy.quickLogWeight }));
    expect(screen.getByText(copy.quickLogComingSoon)).toBeOnTheScreen();
  });
});
