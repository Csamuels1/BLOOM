import { fireEvent, render, screen } from '@testing-library/react-native';
import { router } from 'expo-router';

import { subscriptionCopy } from '@/content/subscription';
import { todayCopy as copy } from '@/content/today';
import { useProfileStore } from '@/features/profile';
import { TodayScreen } from '@/features/today';
import { mockMealsForRegion, type MockMeal } from '@/features/today/mockMeals';

// Deterministic motion (and no async act warnings from the accessibility read).
jest.mock('@/design/useReducedMotion', () => ({
  useReducedMotion: () => false,
}));

jest.mock('expo-router', () => ({ router: { navigate: jest.fn() } }));

/** First meal of a region, asserted present (the catalog always has three). */
function firstMeal(region: 'general' | 'nigeria'): MockMeal {
  const meal = mockMealsForRegion(region)[0];
  if (!meal) throw new Error('expected a mock meal');
  return meal;
}

/** A loaded, onboarded profile for the given region. */
function setLoaded(countryCode: string | null) {
  useProfileStore.setState({
    profile: {
      country_code: countryCode,
      onboarding_completed_at: '2026-11-12T00:00:00Z',
    } as never,
    status: 'loaded',
  });
}

beforeEach(() => {
  (router.navigate as jest.Mock).mockClear();
});

afterEach(() => {
  useProfileStore.setState({ profile: null, status: 'idle' });
});

describe('TodayScreen — overview', () => {
  it('leads with a gentle overview, trend, quick log, meals, and Pro', () => {
    setLoaded(null);
    render(<TodayScreen />);

    expect(screen.getByText(copy.title)).toBeOnTheScreen();
    expect(screen.getByText(copy.intro)).toBeOnTheScreen();
    expect(screen.getByText(copy.trendTitle)).toBeOnTheScreen();
    expect(screen.getByText(copy.quickLogTitle)).toBeOnTheScreen();
    expect(screen.getByText(copy.mealsTitle)).toBeOnTheScreen();
    expect(screen.getByText(subscriptionCopy.proTitle)).toBeOnTheScreen();
  });

  it('makes the Free allowance clear', () => {
    setLoaded(null);
    render(<TodayScreen />);
    expect(
      screen.getByText(
        `${subscriptionCopy.freePlanLabel} · ${subscriptionCopy.freeDailyIdeas}`,
      ),
    ).toBeOnTheScreen();
  });

  it('shows three region-aware meals with calories kept secondary', () => {
    setLoaded('NG');
    render(<TodayScreen />);

    for (const meal of mockMealsForRegion('nigeria')) {
      expect(screen.getByRole('button', { name: meal.name })).toBeOnTheScreen();
    }
    const first = firstMeal('nigeria');
    expect(
      screen.getByText(
        `${copy.mealCaloriesLabel} ${first.calories.min}–${first.calories.max} ${copy.mealCaloriesUnit}`,
      ),
    ).toBeOnTheScreen();
  });

  it('expands a meal to reveal its ingredients only on tap', () => {
    setLoaded(null);
    render(<TodayScreen />);

    const first = firstMeal('general');
    expect(screen.queryByText(first.ingredients)).toBeNull();
    fireEvent.press(screen.getByRole('button', { name: first.name }));
    expect(screen.getByText(first.ingredients)).toBeOnTheScreen();
  });

  it('opens the weight log from the quick-log weight action', () => {
    setLoaded(null);
    render(<TodayScreen />);

    fireEvent.press(screen.getByRole('button', { name: copy.quickLogWeight }));
    expect(router.navigate).toHaveBeenCalledWith('/weight-log');
  });

  it('shows an honest "coming soon" note for meal logging (still Phase 6+)', () => {
    setLoaded(null);
    render(<TodayScreen />);

    expect(screen.queryByText(copy.quickLogComingSoon)).toBeNull();
    fireEvent.press(screen.getByRole('button', { name: copy.quickLogMeal }));
    expect(screen.getByText(copy.quickLogComingSoon)).toBeOnTheScreen();
  });
});

describe('TodayScreen — presentation states', () => {
  it('shows skeletons while the profile is loading (no meals yet)', () => {
    useProfileStore.setState({ profile: null, status: 'loading' });
    render(<TodayScreen />);

    expect(screen.getByLabelText(copy.loadingLabel)).toBeOnTheScreen();
    expect(screen.queryByText(firstMeal('general').name)).toBeNull();
  });

  it('nudges setup gently when onboarding is unfinished, and meals still show', () => {
    useProfileStore.setState({ profile: null, status: 'loaded' });
    render(<TodayScreen />);

    expect(screen.getByText(copy.setupTitle)).toBeOnTheScreen();
    // Meals still render (general fallback) — nothing is lost.
    expect(
      screen.getByRole('button', { name: firstMeal('general').name }),
    ).toBeOnTheScreen();

    fireEvent.press(screen.getByRole('button', { name: copy.setupCta }));
    expect(router.navigate).toHaveBeenCalledWith('/onboarding');
  });

  it('shows a calm, retryable error — and still renders the ideas', () => {
    useProfileStore.setState({ profile: null, status: 'error' });
    const onRetryProfile = jest.fn();
    render(<TodayScreen onRetryProfile={onRetryProfile} />);

    expect(screen.getByText(copy.errorTitle)).toBeOnTheScreen();
    // Fallback ideas remain visible so no content is lost.
    expect(
      screen.getByRole('button', { name: firstMeal('general').name }),
    ).toBeOnTheScreen();

    fireEvent.press(screen.getByRole('button', { name: copy.errorRetry }));
    expect(onRetryProfile).toHaveBeenCalledTimes(1);
  });
});
