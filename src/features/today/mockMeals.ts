/**
 * Typed mock meal catalog for the Today screen (issue #22).
 *
 * These are ILLUSTRATIVE placeholders for Phase 5 only — a branded daily
 * overview before real recommendations. The real, safety-reviewed regional
 * catalog is Phase 7 (and lives in the `meals` table, not here). Calories are a
 * deliberately coarse RANGE and are presented as secondary context, never the
 * headline (AGENTS.md: protect emotional safety; never frame food as good/bad).
 */

export type MealRegion = 'nigeria' | 'general';

export interface MockMeal {
  readonly id: string;
  readonly name: string;
  readonly region: MealRegion;
  /** Illustrative only — shown small and secondary, never a per-user figure. */
  readonly calories: { readonly min: number; readonly max: number };
  /** Neutral, supportive descriptors. Never "clean", "good", or "bad". */
  readonly tags: readonly string[];
  /** Revealed when the card is expanded. */
  readonly ingredients: string;
}

const GENERAL_MEALS: readonly MockMeal[] = [
  {
    id: 'general-1',
    name: 'Oatmeal with berries, yoghurt, and a spoon of nut butter',
    region: 'general',
    calories: { min: 350, max: 450 },
    tags: ['Comforting', 'High fibre'],
    ingredients:
      'Rolled oats, milk or yoghurt, mixed berries, a spoon of nut butter, a drizzle of honey.',
  },
  {
    id: 'general-2',
    name: 'Grilled chicken salad with beans and olive oil',
    region: 'general',
    calories: { min: 450, max: 600 },
    tags: ['High protein'],
    ingredients:
      'Grilled chicken, mixed leaves, white beans, cherry tomatoes, olive oil and lemon.',
  },
  {
    id: 'general-3',
    name: 'Baked fish with brown rice and steamed vegetables',
    region: 'general',
    calories: { min: 500, max: 650 },
    tags: ['Balanced'],
    ingredients:
      'White fish fillet, brown rice, broccoli and carrots, herbs and a little butter.',
  },
];

const NIGERIA_MEALS: readonly MockMeal[] = [
  {
    id: 'nigeria-1',
    name: 'Jollof rice with grilled chicken and sautéed greens',
    region: 'nigeria',
    calories: { min: 550, max: 700 },
    tags: ['Comforting', 'High protein'],
    ingredients:
      'Jollof rice, grilled chicken, sautéed ugu or spinach, a side of plantain.',
  },
  {
    id: 'nigeria-2',
    name: 'Moi moi with a side of pap and fruit',
    region: 'nigeria',
    calories: { min: 350, max: 500 },
    tags: ['Plant-forward'],
    ingredients:
      'Steamed bean pudding (moi moi), pap (ogi), and a bowl of sliced fruit.',
  },
  {
    id: 'nigeria-3',
    name: 'Yam and vegetable sauce with smoked fish',
    region: 'nigeria',
    calories: { min: 500, max: 650 },
    tags: ['Balanced'],
    ingredients:
      'Boiled yam, pepper-and-vegetable sauce, smoked fish, leafy greens.',
  },
];

/**
 * Three mock meals for the overview, chosen by the profile's region. Defaults to
 * the general set when the region is unknown (e.g. profile not yet loaded).
 */
export function mockMealsForRegion(
  region: MealRegion | null,
): readonly MockMeal[] {
  return region === 'nigeria' ? NIGERIA_MEALS : GENERAL_MEALS;
}

/** Map an ISO country code from the profile to a meal region. */
export function regionForCountry(
  countryCode: string | null | undefined,
): MealRegion {
  return countryCode === 'NG' ? 'nigeria' : 'general';
}
