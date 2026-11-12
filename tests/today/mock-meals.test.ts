import {
  mockMealsForRegion,
  regionForCountry,
} from '@/features/today/mockMeals';

describe('regionForCountry', () => {
  it('maps Nigeria to the Nigerian region and everything else to general', () => {
    expect(regionForCountry('NG')).toBe('nigeria');
    expect(regionForCountry('US')).toBe('general');
    expect(regionForCountry(null)).toBe('general');
    expect(regionForCountry(undefined)).toBe('general');
  });
});

describe('mockMealsForRegion', () => {
  it('returns three well-formed meals per region', () => {
    for (const region of ['general', 'nigeria'] as const) {
      const meals = mockMealsForRegion(region);
      expect(meals).toHaveLength(3);
      for (const meal of meals) {
        expect(meal.name.length).toBeGreaterThan(0);
        expect(meal.ingredients.length).toBeGreaterThan(0);
        expect(meal.region).toBe(region);
        // Calories are an illustrative, ordered range.
        expect(meal.calories.min).toBeLessThanOrEqual(meal.calories.max);
      }
    }
  });

  it('defaults to the general set when the region is unknown', () => {
    expect(mockMealsForRegion(null)).toEqual(mockMealsForRegion('general'));
  });
});
