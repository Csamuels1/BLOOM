/**
 * Pure predicates for the recommendation engine (issue #31).
 *
 * `isAllergenSafe` is the SAFETY GATE: everything the engine selects or offers
 * must pass it. Matching is case- and whitespace-insensitive so that a stray
 * casing difference can never let an avoided allergen slip through.
 */

import type { CandidateMeal, RecommendationCriteria } from './types';

/** Normalize a token for robust, case-insensitive comparison. */
function normalize(token: string): string {
  return token.trim().toLowerCase();
}

/**
 * SAFETY-CRITICAL. True only when the meal shares NO allergen with the avoided
 * set. Comparison is case- and whitespace-insensitive. An empty avoid set makes
 * every meal safe; a meal with no allergens is always safe.
 */
export function isAllergenSafe(
  meal: CandidateMeal,
  avoidAllergens: readonly string[],
): boolean {
  if (avoidAllergens.length === 0) {
    return true;
  }
  const avoid = new Set(avoidAllergens.map(normalize));
  return meal.allergens.every((allergen) => !avoid.has(normalize(allergen)));
}

/** True when the meal's region matches the requested region (or is 'both'). */
export function matchesRegion(
  meal: CandidateMeal,
  region: RecommendationCriteria['region'],
): boolean {
  return meal.region === region || meal.region === 'both';
}

/** True when the meal supports the requested goal. */
export function matchesGoal(
  meal: CandidateMeal,
  goal: RecommendationCriteria['goal'],
): boolean {
  return meal.goals.includes(goal);
}

/** True when every requested dietary tag is present on the meal. */
export function matchesDietaryTags(
  meal: CandidateMeal,
  dietaryTags: readonly string[] | undefined,
): boolean {
  if (dietaryTags === undefined || dietaryTags.length === 0) {
    return true;
  }
  const tags = new Set(meal.dietary_tags.map(normalize));
  return dietaryTags.every((tag) => tags.has(normalize(tag)));
}

/**
 * True when the meal's calorie range overlaps the requested range. When no
 * range is requested, every meal passes.
 */
export function matchesCalorieRange(
  meal: CandidateMeal,
  calorieRange: RecommendationCriteria['calorieRange'],
): boolean {
  if (calorieRange === undefined) {
    return true;
  }
  return (
    meal.calories_min <= calorieRange.max &&
    meal.calories_max >= calorieRange.min
  );
}

/**
 * True when the meal satisfies EVERY criterion: region, goal, allergen safety,
 * optional dietary tags, and optional calorie overlap. Allergen safety is
 * always enforced here, so no criteria-matching meal can contain an avoided
 * allergen.
 */
export function matchesCriteria(
  meal: CandidateMeal,
  criteria: RecommendationCriteria,
): boolean {
  return (
    matchesRegion(meal, criteria.region) &&
    matchesGoal(meal, criteria.goal) &&
    isAllergenSafe(meal, criteria.avoidAllergens) &&
    matchesDietaryTags(meal, criteria.dietaryTags) &&
    matchesCalorieRange(meal, criteria.calorieRange)
  );
}
