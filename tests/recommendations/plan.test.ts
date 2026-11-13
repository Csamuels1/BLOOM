import {
  buildPlan,
  type MealSlot,
  type RecommendationCriteria,
} from '@/features/recommendations';
import { recommendationsCopy } from '@/content/recommendations';

import { CANDIDATES } from './fixtures';

const ALL_SLOTS: readonly MealSlot[] = [
  'breakfast',
  'lunch',
  'dinner',
  'snack',
];

describe('buildPlan — determinism / replay', () => {
  it('returns byte-identical output for identical inputs', () => {
    const criteria: RecommendationCriteria = {
      region: 'nigeria',
      goal: 'maintenance',
      avoidAllergens: ['fish'],
    };
    const a = buildPlan(CANDIDATES, criteria, { days: 4, slots: ALL_SLOTS });
    const b = buildPlan(CANDIDATES, criteria, { days: 4, slots: ALL_SLOTS });
    expect(a).toEqual(b);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  it('is independent of candidate input order (stable id tie-break)', () => {
    const criteria: RecommendationCriteria = {
      region: 'both',
      goal: 'loss',
      avoidAllergens: [],
    };
    const forward = buildPlan(CANDIDATES, criteria, {
      days: 3,
      slots: ALL_SLOTS,
    });
    const reversed = buildPlan([...CANDIDATES].reverse(), criteria, {
      days: 3,
      slots: ALL_SLOTS,
    });
    expect(forward).toEqual(reversed);
  });
});

describe('buildPlan — every input affects selection', () => {
  function pickedIds(criteria: RecommendationCriteria): string[] {
    const plan = buildPlan(CANDIDATES, criteria, { days: 1, slots: ALL_SLOTS });
    const day = plan.days[0];
    if (day === undefined) {
      return [];
    }
    return day.slots
      .map((slot) => slot.meal?.mealId)
      .filter((id): id is string => id !== undefined);
  }

  it('region filters the candidate set', () => {
    const base: RecommendationCriteria = {
      region: 'nigeria',
      goal: 'maintenance',
      avoidAllergens: [],
    };
    const ng = pickedIds(base);
    const us = pickedIds({ ...base, region: 'united_states' });
    // Nigeria plan should include a Nigeria-only meal; US plan must not.
    expect(ng).toContain('ng-l1');
    expect(us).not.toContain('ng-l1');
  });

  it('goal filters the candidate set', () => {
    const base: RecommendationCriteria = {
      region: 'nigeria',
      goal: 'gain',
      avoidAllergens: [],
    };
    const gainLunch = pickedIds(base);
    const lossLunch = pickedIds({ ...base, goal: 'loss' });
    // Only gain supports ng-l2 (egusi); loss does not support any NG lunch.
    expect(gainLunch).toContain('ng-l1');
    expect(lossLunch).not.toContain('ng-l1');
  });

  it('dietary tags filter the candidate set', () => {
    const base: RecommendationCriteria = {
      region: 'both',
      goal: 'gain',
      avoidAllergens: [],
    };
    const anyTag = pickedIds(base);
    const veganOnly = pickedIds({ ...base, dietaryTags: ['vegan'] });
    expect(anyTag).toContain('both-s1'); // yoghurt snack (vegetarian, not vegan)
    expect(veganOnly).not.toContain('both-s1');
    expect(veganOnly).toContain('both-s2'); // groundnuts (vegan)
  });

  it('calorie range filters the candidate set', () => {
    const base: RecommendationCriteria = {
      region: 'nigeria',
      goal: 'gain',
      avoidAllergens: [],
    };
    const wide = pickedIds(base);
    const lowOnly = pickedIds({
      ...base,
      calorieRange: { min: 300, max: 500 },
    });
    expect(wide).toContain('ng-l1'); // 550-700 lunch
    expect(lowOnly).not.toContain('ng-l1'); // excluded by the low range
  });

  it('avoided allergens filter the candidate set', () => {
    const base: RecommendationCriteria = {
      region: 'both',
      goal: 'maintenance',
      avoidAllergens: [],
    };
    const withMilk = pickedIds(base);
    const noMilk = pickedIds({ ...base, avoidAllergens: ['milk'] });
    expect(withMilk).toContain('both-s1'); // yoghurt contains milk
    expect(noMilk).not.toContain('both-s1');
  });
});

describe('buildPlan — no repetition until pool exhausted', () => {
  it('cycles a slot pool deterministically without early repeats', () => {
    const criteria: RecommendationCriteria = {
      region: 'nigeria',
      goal: 'maintenance',
      avoidAllergens: [],
    };
    // Nigeria breakfast pool after filtering = [ng-b1, ng-b2] (size 2).
    const plan = buildPlan(CANDIDATES, criteria, {
      days: 4,
      slots: ['breakfast'],
    });
    const breakfastIds = plan.days.map((day) => day.slots[0]?.meal?.mealId);
    expect(breakfastIds).toEqual(['ng-b1', 'ng-b2', 'ng-b1', 'ng-b2']);
    // No repeat within the first `poolSize` days.
    expect(new Set([breakfastIds[0], breakfastIds[1]]).size).toBe(2);
  });
});

describe('buildPlan — gaps and reasons', () => {
  it('surfaces an explicit gap when no safe candidate exists for a slot', () => {
    // Avoid every allergen present in NG lunches while forcing the gain goal:
    // ng-l1 has no allergens but supports gain; exclude it via an impossible
    // calorie range so the lunch slot has no candidate.
    const criteria: RecommendationCriteria = {
      region: 'nigeria',
      goal: 'gain',
      avoidAllergens: ['fish'], // removes egusi
      calorieRange: { min: 9000, max: 9999 }, // removes jollof
    };
    const plan = buildPlan(CANDIDATES, criteria, { days: 1, slots: ['lunch'] });
    const lunch = plan.days[0]?.slots[0];
    expect(lunch?.meal).toBeNull();
    expect(lunch?.gap).toBe(recommendationsCopy.gapNoSafeMeal);
  });

  it('every selected meal has non-empty reasons', () => {
    const criteria: RecommendationCriteria = {
      region: 'both',
      goal: 'maintenance',
      avoidAllergens: [],
      dietaryTags: ['vegetarian'],
      calorieRange: { min: 100, max: 900 },
    };
    const plan = buildPlan(CANDIDATES, criteria, { days: 2, slots: ALL_SLOTS });
    let sawMeal = false;
    for (const day of plan.days) {
      for (const slot of day.slots) {
        if (slot.meal !== null) {
          sawMeal = true;
          expect(slot.meal.reasons.length).toBeGreaterThan(0);
          for (const reason of slot.meal.reasons) {
            expect(reason.length).toBeGreaterThan(0);
          }
          // Allergen-safe reason is always present on a pick.
          expect(slot.meal.reasons).toContain(
            recommendationsCopy.reasonAllergenSafe,
          );
        }
      }
    }
    expect(sawMeal).toBe(true);
  });
});
