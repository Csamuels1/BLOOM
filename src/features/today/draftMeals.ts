import { APP_ENVIRONMENTS, type AppEnvironment } from '@/config/env';
import { todayCopy as copy } from '@/content/today';
import {
  buildPlan,
  catalogAllergensFor,
  matchesCriteria,
  type MealGoal,
  type MealSlot,
  type RecommendationCriteria,
} from '@/features/recommendations';

import type { DraftMeal } from './draftCatalog.generated';
import { calendarDayNumber } from './greeting';
import { regionForCountry, type MockMeal } from './mockMeals';

/**
 * Daily rotation of the DRAFT meal catalog for test builds (issue #159).
 *
 * The 56 catalog meals are unreviewed drafts (ADR-0010) and must never reach
 * production. They are loaded only when the app environment is not
 * 'production', through a conditional `require()` so a production bundle can
 * drop the dataset entirely.
 *
 * Selection runs through the recommendation engine's own filters, so the
 * allergen safety gate always applies. The engine has no clock: the date math
 * lives here, rotating each slot's safe pool by the local calendar day before
 * the engine makes the final, re-checked pick.
 */

/** Slots shown on Today, in display order. Snack appears only if catalogued. */
export const DRAFT_SLOTS = [
  'breakfast',
  'lunch',
  'dinner',
  'snack',
] as const satisfies readonly MealSlot[];

function isAppEnvironment(value: string): value is AppEnvironment {
  return (APP_ENVIRONMENTS as readonly string[]).includes(value);
}

/**
 * The app environment from `EXPO_PUBLIC_APP_ENV`, for the draft-meal gate only.
 * It FAILS CLOSED: unset, empty or unrecognised all mean 'production', so a
 * build that forgets to name its environment can only hide drafts, never show
 * them. (src/config/env.ts defaults unset to 'local' for other purposes; local
 * dev sets the variable in .env, and EAS test builds set it per environment.)
 */
export function resolveAppEnv(
  raw: string | undefined = process.env.EXPO_PUBLIC_APP_ENV,
): AppEnvironment {
  return raw !== undefined && isAppEnvironment(raw) ? raw : 'production';
}

/** True when draft meals may be shown: every environment except production. */
export function draftMealsAllowed(appEnv: AppEnvironment): boolean {
  return appEnv !== 'production';
}

/**
 * PRODUCTION GATE. The draft catalog for a non-production environment, or an
 * empty list in production. The second check reads the inlined build-time
 * value, so in a production bundle the `require()` sits in dead code and the
 * dataset can be dropped by the minifier.
 */
export function loadDraftCatalog(appEnv: AppEnvironment): readonly DraftMeal[] {
  if (
    draftMealsAllowed(appEnv) &&
    process.env.EXPO_PUBLIC_APP_ENV !== 'production'
  ) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const generated = require('./draftCatalog.generated') as {
      DRAFT_CATALOG: readonly DraftMeal[];
    };
    return generated.DRAFT_CATALOG;
  }
  return [];
}

/**
 * Preferences the catalog tags directly. 'pescatarian' and 'halal' are not
 * tagged in the draft catalog yet, so they cannot be filtered on here.
 */
const TAGGED_PREFERENCES = new Set(['vegetarian', 'vegan']);

const GOALS: readonly MealGoal[] = ['loss', 'maintenance', 'gain'];

/** The profile fields that steer draft selection. All optional. */
export interface DraftProfileInput {
  readonly country_code?: string | null;
  readonly allergens?: readonly string[] | null;
  readonly dietary_preferences?: readonly string[] | null;
  readonly goal?: string | null;
}

/**
 * Catalog allergens to avoid for a profile's allergens and preferences.
 * SAFETY: delegates to the canonical mapping (`catalogAllergensFor`, #160);
 * each normalized profile value is also kept, as it was in #159.
 */
export function avoidAllergensFor(profile: DraftProfileInput | null): string[] {
  const avoid = new Set<string>(
    catalogAllergensFor(profile?.allergens, profile?.dietary_preferences),
  );
  for (const raw of profile?.allergens ?? []) {
    avoid.add(raw.trim().toLowerCase());
  }
  return [...avoid].sort();
}

/**
 * Engine criteria for a profile. Region comes from the country
 * ('general' maps to the US catalog); goal defaults to maintenance when the
 * profile has none.
 */
export function criteriaForProfile(
  profile: DraftProfileInput | null,
): RecommendationCriteria {
  const region =
    regionForCountry(profile?.country_code) === 'nigeria'
      ? 'nigeria'
      : 'united_states';
  const goal =
    GOALS.find((candidate) => candidate === profile?.goal) ?? 'maintenance';
  const dietaryTags = (profile?.dietary_preferences ?? [])
    .map((tag) => tag.trim().toLowerCase())
    .filter((tag) => TAGGED_PREFERENCES.has(tag));
  return {
    region,
    goal,
    avoidAllergens: avoidAllergensFor(profile),
    dietaryTags,
  };
}

/** A vegan meal is also vegetarian; make that explicit for tag matching. */
function withImpliedTags(meal: DraftMeal): DraftMeal {
  if (
    meal.dietary_tags.includes('vegan') &&
    !meal.dietary_tags.includes('vegetarian')
  ) {
    return { ...meal, dietary_tags: [...meal.dietary_tags, 'vegetarian'] };
  }
  return meal;
}

function compareById(a: DraftMeal, b: DraftMeal): number {
  if (a.id < b.id) return -1;
  if (a.id > b.id) return 1;
  return 0;
}

/** One slot of the day: a draft meal, or the engine's honest gap. */
export interface DraftDayPick {
  readonly slot: MealSlot;
  readonly meal: DraftMeal | null;
  readonly gap: string | null;
}

/**
 * The day's draft meals, one per slot. Deterministic by LOCAL calendar date:
 * stable all day, and on consecutive days each slot moves to the next meal in
 * its safe pool (when the pool has more than one). The engine filters every
 * candidate (allergen gate included) and makes the final pick; an empty pool
 * comes back as the engine's explicit gap, never an unsafe fill.
 */
export function selectDraftMealsForDate(
  catalog: readonly DraftMeal[],
  criteria: RecommendationCriteria,
  date: Date,
): DraftDayPick[] {
  const meals = catalog.map(withImpliedTags);
  const slots = DRAFT_SLOTS.filter((slot) =>
    meals.some((meal) => meal.slot === slot),
  );
  const day = calendarDayNumber(date);

  // Date math stays outside the engine: rotate each slot's safe pool by the
  // day index and offer the engine just that day's candidate per slot.
  const offered: DraftMeal[] = [];
  for (const slot of slots) {
    const pool = meals
      .filter((meal) => meal.slot === slot && matchesCriteria(meal, criteria))
      .sort(compareById);
    const pick = pool[((day % pool.length) + pool.length) % pool.length];
    if (pick !== undefined) offered.push(pick);
  }

  const plan = buildPlan(offered, criteria, { days: 1, slots });
  const byId = new Map(offered.map((meal) => [meal.id, meal]));
  return (plan.days[0]?.slots ?? []).map((planSlot) => {
    const meal = planSlot.meal
      ? (byId.get(planSlot.meal.mealId) ?? null)
      : null;
    return {
      slot: planSlot.slot,
      meal,
      gap: meal ? null : planSlot.gap,
    };
  });
}

const TAG_LABELS: Readonly<Record<string, string>> = {
  high_fibre: copy.draftTagHighFibre,
  high_protein: copy.draftTagHighProtein,
  balanced: copy.draftTagBalanced,
  vegetarian: copy.draftTagVegetarian,
  vegan: copy.draftTagVegan,
  gluten_free: copy.draftTagGlutenFree,
};

/** Calm heading for a slot the engine left open. */
export const DRAFT_GAP_HEADINGS: Readonly<Record<MealSlot, string>> = {
  breakfast: copy.draftGapBreakfast,
  lunch: copy.draftGapLunch,
  dinner: copy.draftGapDinner,
  snack: copy.draftGapSnack,
};

/** Present a draft meal in the card shape MealCard already renders. */
export function toCardMeal(meal: DraftMeal): MockMeal {
  const ingredients = meal.ingredients.join(', ');
  return {
    id: meal.id,
    name: meal.name,
    region: meal.region === 'nigeria' ? 'nigeria' : 'general',
    slot: meal.slot,
    calories: { min: meal.calories_min, max: meal.calories_max },
    tags: meal.dietary_tags.flatMap((tag) => {
      const label = TAG_LABELS[tag];
      return label ? [label] : [];
    }),
    ingredients: ingredients
      ? `${ingredients.charAt(0).toUpperCase()}${ingredients.slice(1)}.`
      : '',
  };
}
