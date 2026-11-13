import {
  isAllergenSafe,
  matchesCalorieRange,
  matchesCriteria,
  matchesDietaryTags,
  matchesGoal,
  matchesRegion,
  type CandidateMeal,
  type RecommendationCriteria,
} from '@/features/recommendations';

import { CANDIDATES } from './fixtures';

function mealWith(overrides: Partial<CandidateMeal>): CandidateMeal {
  return {
    id: 'x',
    name: 'Test meal',
    region: 'both',
    goals: ['loss', 'maintenance', 'gain'],
    slot: 'lunch',
    allergens: [],
    dietary_tags: [],
    calories_min: 400,
    calories_max: 600,
    ...overrides,
  };
}

describe('isAllergenSafe (safety gate)', () => {
  it('is safe when no allergens are avoided', () => {
    const meal = mealWith({ allergens: ['peanut', 'milk'] });
    expect(isAllergenSafe(meal, [])).toBe(true);
  });

  it('is safe when the meal has no allergens', () => {
    expect(isAllergenSafe(mealWith({ allergens: [] }), ['peanut'])).toBe(true);
  });

  it('is unsafe when the meal shares any avoided allergen', () => {
    const meal = mealWith({ allergens: ['milk', 'gluten'] });
    expect(isAllergenSafe(meal, ['gluten'])).toBe(false);
  });

  it('matches allergens case- and whitespace-insensitively', () => {
    const meal = mealWith({ allergens: ['  Peanut '] });
    expect(isAllergenSafe(meal, ['PEANUT'])).toBe(false);
    expect(isAllergenSafe(meal, ['peanut'])).toBe(false);
  });
});

describe('individual criterion predicates', () => {
  it('matchesRegion accepts the region and "both"', () => {
    expect(matchesRegion(mealWith({ region: 'nigeria' }), 'nigeria')).toBe(
      true,
    );
    expect(matchesRegion(mealWith({ region: 'both' }), 'nigeria')).toBe(true);
    expect(
      matchesRegion(mealWith({ region: 'united_states' }), 'nigeria'),
    ).toBe(false);
  });

  it('matchesGoal requires the goal to be supported', () => {
    expect(matchesGoal(mealWith({ goals: ['gain'] }), 'gain')).toBe(true);
    expect(matchesGoal(mealWith({ goals: ['loss'] }), 'gain')).toBe(false);
  });

  it('matchesDietaryTags requires every requested tag', () => {
    const meal = mealWith({ dietary_tags: ['vegan', 'dairy-free'] });
    expect(matchesDietaryTags(meal, ['vegan'])).toBe(true);
    expect(matchesDietaryTags(meal, ['vegan', 'dairy-free'])).toBe(true);
    expect(matchesDietaryTags(meal, ['vegetarian'])).toBe(false);
    expect(matchesDietaryTags(meal, undefined)).toBe(true);
    expect(matchesDietaryTags(meal, [])).toBe(true);
  });

  it('matchesCalorieRange requires an overlap', () => {
    const meal = mealWith({ calories_min: 400, calories_max: 600 });
    expect(matchesCalorieRange(meal, { min: 550, max: 800 })).toBe(true);
    expect(matchesCalorieRange(meal, { min: 100, max: 450 })).toBe(true);
    expect(matchesCalorieRange(meal, { min: 700, max: 900 })).toBe(false);
    expect(matchesCalorieRange(meal, undefined)).toBe(true);
  });
});

describe('matchesCriteria', () => {
  const base: RecommendationCriteria = {
    region: 'united_states',
    goal: 'loss',
    avoidAllergens: [],
  };

  it('requires all criteria including the allergen gate', () => {
    const meal = mealWith({
      region: 'united_states',
      goals: ['loss'],
      allergens: ['peanut'],
    });
    expect(matchesCriteria(meal, base)).toBe(true);
    expect(matchesCriteria(meal, { ...base, avoidAllergens: ['peanut'] })).toBe(
      false,
    );
  });

  it('never matches a meal containing an avoided allergen', () => {
    for (const meal of CANDIDATES) {
      for (const allergen of meal.allergens) {
        expect(
          matchesCriteria(meal, {
            region: meal.region === 'both' ? 'nigeria' : meal.region,
            goal: 'maintenance',
            avoidAllergens: [allergen],
          }),
        ).toBe(false);
      }
    }
  });
});
