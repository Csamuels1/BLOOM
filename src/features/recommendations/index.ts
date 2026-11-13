/**
 * Deterministic recommendation engine (issue #31). Pure TypeScript: no DB, no
 * network, no React. Callers supply candidate meals; the engine filters and
 * selects explainable, allergen-safe plans and swaps.
 */

export {
  isAllergenSafe,
  matchesCriteria,
  matchesRegion,
  matchesGoal,
  matchesDietaryTags,
  matchesCalorieRange,
} from './filter';
export { buildPlan, swapMeal } from './select';
export type {
  CalorieRange,
  CandidateMeal,
  MealGoal,
  MealRegion,
  MealSlot,
  PlanDay,
  PlanOptions,
  PlanSlot,
  RecommendationCriteria,
  RecommendationPlan,
  SelectedMeal,
  SwapOptions,
  SwapResult,
} from './types';
