import {
  buildPlan,
  CATALOG_ALLERGENS,
  catalogAllergensFor,
  DIETARY_PREFERENCES,
  PREFERENCE_AVOIDS,
  PROFILE_ALLERGENS,
  PROFILE_TO_CATALOG_ALLERGENS,
} from '@/features/recommendations';
import { DRAFT_CATALOG } from '@/features/today/draftCatalog.generated';

/**
 * SAFETY-CRITICAL (#160). The canonical mapping from profile allergens
 * (onboarding vocabulary) to catalog allergens. A gap here would let an
 * allergic user see a meal containing their allergen.
 */
describe('canonical allergen mapping (#160)', () => {
  const catalog = new Set<string>(CATALOG_ALLERGENS);

  it('maps every onboarding allergen option to at least one catalog allergen', () => {
    for (const allergen of PROFILE_ALLERGENS) {
      const mapped = catalogAllergensFor([allergen], []);
      expect(mapped.length).toBeGreaterThan(0);
      for (const value of mapped) expect(catalog.has(value)).toBe(true);
    }
  });

  it('maps every implied preference avoid into the catalog vocabulary', () => {
    for (const preference of DIETARY_PREFERENCES) {
      for (const value of PREFERENCE_AVOIDS[preference] ?? []) {
        expect(catalog.has(value)).toBe(true);
      }
    }
  });

  it('covers every catalog allergen with some profile allergen', () => {
    const reachable = new Set(
      Object.values(PROFILE_TO_CATALOG_ALLERGENS).flat(),
    );
    for (const allergen of CATALOG_ALLERGENS) {
      expect(reachable.has(allergen)).toBe(true);
    }
  });

  it('knows every allergen value in the generated draft catalog', () => {
    const used = new Set(DRAFT_CATALOG.flatMap((meal) => meal.allergens));
    expect(used.size).toBeGreaterThan(0);
    for (const value of used) expect(catalog.has(value)).toBe(true);
  });

  it('maps the values that differ between the vocabularies', () => {
    expect(catalogAllergensFor(['peanut'], [])).toEqual(['peanuts']);
    expect(catalogAllergensFor(['tree_nut'], [])).toEqual(['tree_nuts']);
    expect(catalogAllergensFor(['milk'], [])).toEqual(['dairy']);
    expect(catalogAllergensFor(['wheat'], [])).toEqual(['gluten']);
  });

  it('is case/space-insensitive, keeps catalog values, and de-duplicates', () => {
    expect(
      catalogAllergensFor([' Peanut ', 'PEANUTS', 'milk'], ['Low_Dairy']),
    ).toEqual(['dairy', 'peanuts']);
    expect(catalogAllergensFor(null, undefined)).toEqual([]);
    expect(catalogAllergensFor(['unknown'], ['vegan'])).toEqual([]);
  });

  it('treats a low-dairy preference as avoiding dairy', () => {
    expect(catalogAllergensFor([], ['low_dairy'])).toEqual(['dairy']);
  });

  it('never lets a profile allergen through the engine on the draft catalog', () => {
    for (const allergen of PROFILE_ALLERGENS) {
      const avoid = catalogAllergensFor([allergen], []);
      for (const region of ['nigeria', 'united_states'] as const) {
        const plan = buildPlan(
          DRAFT_CATALOG,
          { region, goal: 'maintenance', avoidAllergens: avoid },
          { days: 7, slots: ['breakfast', 'lunch', 'dinner', 'snack'] },
        );
        for (const day of plan.days) {
          for (const slot of day.slots) {
            if (!slot.meal) continue;
            const meal = DRAFT_CATALOG.find((m) => m.id === slot.meal?.mealId);
            expect(meal).toBeDefined();
            for (const value of avoid) {
              expect(meal?.allergens ?? []).not.toContain(value);
            }
          }
        }
      }
    }
  });
});
