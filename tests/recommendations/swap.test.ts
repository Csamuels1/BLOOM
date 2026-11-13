import {
  swapMeal,
  type RecommendationCriteria,
} from '@/features/recommendations';
import { recommendationsCopy } from '@/content/recommendations';

import { CANDIDATES } from './fixtures';

describe('swapMeal', () => {
  const criteria: RecommendationCriteria = {
    region: 'both',
    goal: 'maintenance',
    avoidAllergens: [],
  };

  it('is deterministic (replay-stable)', () => {
    const a = swapMeal('both-s1', CANDIDATES, criteria, { slot: 'snack' });
    const b = swapMeal('both-s1', CANDIDATES, criteria, { slot: 'snack' });
    expect(a).toEqual(b);
  });

  it('returns a different, criteria-matching meal for the same slot', () => {
    const result = swapMeal('both-s1', CANDIDATES, criteria, { slot: 'snack' });
    expect(result.reason).toBeNull();
    expect(result.meal).not.toBeNull();
    expect(result.meal?.mealId).not.toBe('both-s1');
    expect(result.meal?.mealId).toBe('both-s2');
  });

  it('never offers the current meal or an excluded meal', () => {
    const result = swapMeal('both-s1', CANDIDATES, criteria, {
      slot: 'snack',
      excludeIds: ['both-s2'],
    });
    // Both snacks are excluded (current + excludeIds) → no alternative.
    expect(result.meal).toBeNull();
    expect(result.reason).toBe(recommendationsCopy.swapNoAlternative);
  });

  it('never offers a swap containing an avoided allergen', () => {
    const result = swapMeal('__none__', CANDIDATES, criteria, {
      slot: 'snack',
      excludeIds: [],
    });
    // Both snacks (yoghurt=milk, groundnuts=peanut); avoid both → gap.
    const avoidBoth = swapMeal(
      '__none__',
      CANDIDATES,
      {
        ...criteria,
        avoidAllergens: ['milk', 'peanut'],
      },
      { slot: 'snack' },
    );
    expect(result.meal).not.toBeNull();
    expect(avoidBoth.meal).toBeNull();
    expect(avoidBoth.reason).toBe(recommendationsCopy.swapNoAlternative);
  });

  it('returns a reason when no alternative fits', () => {
    const result = swapMeal('both-d1', CANDIDATES, criteria, {
      slot: 'dinner',
      excludeIds: ['both-d2'],
    });
    expect(result.meal).toBeNull();
    expect(result.reason).toBe(recommendationsCopy.swapNoAlternative);
  });

  it('a swapped meal carries non-empty reasons', () => {
    const result = swapMeal(
      '__none__',
      CANDIDATES,
      { ...criteria, region: 'nigeria' },
      { slot: 'lunch' },
    );
    expect(result.meal).not.toBeNull();
    expect(result.meal?.reasons.length).toBeGreaterThan(0);
  });
});
