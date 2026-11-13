import {
  buildPlan,
  swapMeal,
  type RecommendationCriteria,
  type SelectedMeal,
} from '@/features/recommendations';

import {
  ALLERGEN_POOL,
  buildMatrixCandidates,
  GOALS,
  REGIONS,
  SLOTS,
} from './fixtures';

/**
 * SAFETY-CRITICAL property/matrix test. Over a large matrix of candidate sets
 * and avoided-allergen sets, assert that NO meal selected in a plan and NO meal
 * returned by a swap ever contains an avoided allergen.
 */

const candidates = buildMatrixCandidates();

/** Lower-cased lookup of a meal's allergens by id, for assertions. */
const allergensById = new Map<string, string[]>(
  candidates.map((meal) => [
    meal.id,
    meal.allergens.map((a) => a.trim().toLowerCase()),
  ]),
);

function assertSafe(selected: SelectedMeal, avoid: readonly string[]): void {
  const mealAllergens = allergensById.get(selected.mealId) ?? [];
  for (const avoided of avoid) {
    expect(mealAllergens).not.toContain(avoided.trim().toLowerCase());
  }
}

/** Every non-empty subset of the allergen pool, as avoided-allergen sets. */
function allergenSubsets(): string[][] {
  const subsets: string[][] = [];
  const total = 1 << ALLERGEN_POOL.length;
  for (let mask = 0; mask < total; mask += 1) {
    const subset: string[] = [];
    for (let a = 0; a < ALLERGEN_POOL.length; a += 1) {
      if ((mask >> a) % 2 === 1) {
        const item = ALLERGEN_POOL[a];
        if (item !== undefined) {
          subset.push(item);
        }
      }
    }
    subsets.push(subset);
  }
  return subsets;
}

describe('allergen exclusion is absolute (plans)', () => {
  it('never places a meal containing an avoided allergen, across the matrix', () => {
    const subsets = allergenSubsets();
    let checkedPicks = 0;
    for (const region of REGIONS) {
      for (const goal of GOALS) {
        for (const avoidAllergens of subsets) {
          const criteria: RecommendationCriteria = {
            region,
            goal,
            avoidAllergens,
          };
          const plan = buildPlan(candidates, criteria, {
            days: 5,
            slots: SLOTS,
          });
          for (const day of plan.days) {
            for (const slot of day.slots) {
              if (slot.meal !== null) {
                assertSafe(slot.meal, avoidAllergens);
                checkedPicks += 1;
              }
            }
          }
        }
      }
    }
    // Ensure the matrix actually exercised real picks (not all gaps).
    expect(checkedPicks).toBeGreaterThan(0);
  });

  it('uppercased / padded avoided allergens are still excluded', () => {
    const criteria: RecommendationCriteria = {
      region: 'both',
      goal: 'maintenance',
      avoidAllergens: [' PEANUT ', 'Milk'],
    };
    const plan = buildPlan(candidates, criteria, { days: 7, slots: SLOTS });
    for (const day of plan.days) {
      for (const slot of day.slots) {
        if (slot.meal !== null) {
          const mealAllergens = allergensById.get(slot.meal.mealId) ?? [];
          expect(mealAllergens).not.toContain('peanut');
          expect(mealAllergens).not.toContain('milk');
        }
      }
    }
  });
});

describe('allergen exclusion is absolute (swaps)', () => {
  it('never offers a swap containing an avoided allergen, across the matrix', () => {
    const subsets = allergenSubsets();
    let checkedSwaps = 0;
    for (const region of REGIONS) {
      for (const goal of GOALS) {
        for (const avoidAllergens of subsets) {
          const criteria: RecommendationCriteria = {
            region,
            goal,
            avoidAllergens,
          };
          for (const slot of SLOTS) {
            // Swap starting from a non-existent current id so the full pool is
            // eligible, then keep swapping while excluding what we have seen.
            const excludeIds: string[] = [];
            for (let i = 0; i < 6; i += 1) {
              const result = swapMeal('__none__', candidates, criteria, {
                slot,
                excludeIds,
              });
              if (result.meal === null) {
                expect(result.reason).not.toBeNull();
                break;
              }
              assertSafe(result.meal, avoidAllergens);
              checkedSwaps += 1;
              excludeIds.push(result.meal.mealId);
            }
          }
        }
      }
    }
    expect(checkedSwaps).toBeGreaterThan(0);
  });
});
