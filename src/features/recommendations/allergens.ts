/**
 * The ONE canonical allergen vocabulary and mapping (issue #160).
 *
 * SAFETY-CRITICAL. Profiles store allergens in the onboarding vocabulary
 * ('peanut', 'milk', 'wheat', ...), while the meal catalog tags meals in the
 * catalog vocabulary ('peanuts', 'dairy', 'gluten', ...). The engine compares
 * strings, so raw profile values would miss matches: a peanut-allergic user
 * would NOT be protected. Every caller that builds `avoidAllergens` from a
 * profile must go through `catalogAllergensFor`.
 *
 * Drift guards: a Jest test checks PROFILE_ALLERGENS / DIETARY_PREFERENCES
 * against the onboarding options and that every value in the generated draft
 * catalog is a CatalogAllergen; a toolchain test checks every `allergens`
 * value in the catalog migrations against CATALOG_ALLERGENS.
 */

/** Allergen values the meal catalog uses (`public.meals.allergens`). */
export const CATALOG_ALLERGENS = [
  'peanuts',
  'tree_nuts',
  'dairy',
  'gluten',
  'egg',
  'soy',
  'fish',
  'shellfish',
] as const;
export type CatalogAllergen = (typeof CATALOG_ALLERGENS)[number];

/** Allergen values a profile stores (the onboarding allergen options). */
export const PROFILE_ALLERGENS = [
  'peanut',
  'tree_nut',
  'milk',
  'egg',
  'soy',
  'wheat',
  'fish',
  'shellfish',
] as const;
export type ProfileAllergen = (typeof PROFILE_ALLERGENS)[number];

/** Dietary preference values a profile stores (the onboarding options). */
export const DIETARY_PREFERENCES = [
  'vegetarian',
  'vegan',
  'pescatarian',
  'halal',
  'low_dairy',
] as const;
export type DietaryPreference = (typeof DIETARY_PREFERENCES)[number];

/** Each profile allergen mapped onto the catalog allergens it must avoid. */
export const PROFILE_TO_CATALOG_ALLERGENS: Readonly<
  Record<ProfileAllergen, readonly CatalogAllergen[]>
> = {
  peanut: ['peanuts'],
  tree_nut: ['tree_nuts'],
  milk: ['dairy'],
  egg: ['egg'],
  soy: ['soy'],
  wheat: ['gluten'],
  fish: ['fish'],
  shellfish: ['shellfish'],
};

/** Dietary preferences that imply avoiding a catalog allergen. */
export const PREFERENCE_AVOIDS: Readonly<
  Partial<Record<DietaryPreference, readonly CatalogAllergen[]>>
> = {
  low_dairy: ['dairy'],
};

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

function isProfileAllergen(value: string): value is ProfileAllergen {
  return (PROFILE_ALLERGENS as readonly string[]).includes(value);
}

function isCatalogAllergen(value: string): value is CatalogAllergen {
  return (CATALOG_ALLERGENS as readonly string[]).includes(value);
}

function isDietaryPreference(value: string): value is DietaryPreference {
  return (DIETARY_PREFERENCES as readonly string[]).includes(value);
}

/**
 * Catalog allergens to avoid for a profile's allergens and dietary
 * preferences. Case/space-insensitive. A value already in the catalog
 * vocabulary is kept as-is. Sorted and de-duplicated.
 */
export function catalogAllergensFor(
  profileAllergens: readonly string[] | null | undefined,
  dietaryPreferences: readonly string[] | null | undefined,
): CatalogAllergen[] {
  const avoid = new Set<CatalogAllergen>();
  for (const raw of profileAllergens ?? []) {
    const value = normalize(raw);
    if (isProfileAllergen(value)) {
      for (const mapped of PROFILE_TO_CATALOG_ALLERGENS[value]) {
        avoid.add(mapped);
      }
    }
    if (isCatalogAllergen(value)) avoid.add(value);
  }
  for (const raw of dietaryPreferences ?? []) {
    const value = normalize(raw);
    if (isDietaryPreference(value)) {
      for (const mapped of PREFERENCE_AVOIDS[value] ?? []) avoid.add(mapped);
    }
  }
  return [...avoid].sort();
}
