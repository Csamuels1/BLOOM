/**
 * Deterministic planner and swapper for the recommendation engine (issue #31).
 *
 * DETERMINISM: no randomness, no clock, no locale-dependent sort. Candidates are
 * always ordered by `id` ascending (a stable, byte-level tie-break), so given
 * identical inputs the output is byte-identical on every call (replay-stable).
 *
 * SAFETY: every meal placed in a plan or returned as a swap passes
 * `matchesCriteria`, which enforces `isAllergenSafe`. A slot with no safe,
 * matching candidate is surfaced as an explicit gap — never filled with an
 * unsafe or non-matching meal.
 */

import { recommendationsCopy, slotLabel } from '@/content/recommendations';

import { matchesCriteria } from './filter';
import type {
  CandidateMeal,
  PlanDay,
  PlanOptions,
  PlanSlot,
  RecommendationCriteria,
  RecommendationPlan,
  SelectedMeal,
  SwapOptions,
  SwapResult,
} from './types';

/**
 * Stable ordering by id ascending. Uses a plain code-unit comparison (not
 * locale-aware) so the result never depends on the host locale.
 */
function compareById(a: CandidateMeal, b: CandidateMeal): number {
  if (a.id < b.id) {
    return -1;
  }
  if (a.id > b.id) {
    return 1;
  }
  return 0;
}

/**
 * The eligible pool for one slot: candidates that match every criterion AND
 * belong to the slot, ordered deterministically by id. Pure; never mutates the
 * input array.
 */
function poolForSlot(
  candidates: readonly CandidateMeal[],
  criteria: RecommendationCriteria,
  slot: CandidateMeal['slot'],
): CandidateMeal[] {
  return candidates
    .filter((meal) => meal.slot === slot && matchesCriteria(meal, criteria))
    .slice()
    .sort(compareById);
}

/** Build the non-empty, explainable reasons for a pick. */
function buildReasons(
  meal: CandidateMeal,
  criteria: RecommendationCriteria,
): string[] {
  const reasons: string[] = [
    recommendationsCopy.reasonRegion,
    recommendationsCopy.reasonGoal,
    `${recommendationsCopy.reasonSlotPrefix} ${slotLabel[meal.slot]}`,
    // Always present because selection passed the safety gate.
    recommendationsCopy.reasonAllergenSafe,
  ];
  if (criteria.dietaryTags !== undefined && criteria.dietaryTags.length > 0) {
    reasons.push(recommendationsCopy.reasonDietary);
  }
  if (criteria.calorieRange !== undefined) {
    reasons.push(recommendationsCopy.reasonWithinCalories);
  }
  return reasons;
}

/** Convert a candidate into an explainable selected meal. */
function toSelected(
  meal: CandidateMeal,
  criteria: RecommendationCriteria,
): SelectedMeal {
  return {
    mealId: meal.id,
    name: meal.name,
    reasons: buildReasons(meal, criteria),
  };
}

/**
 * Build a deterministic, explainable plan.
 *
 * For each slot we compute the eligible pool once, then walk it across days so
 * meals do not repeat until the pool is exhausted, cycling deterministically:
 * day d (0-based) takes pool[d % poolLength]. When a slot's pool is empty, that
 * slot is an explicit gap.
 */
export function buildPlan(
  candidates: readonly CandidateMeal[],
  criteria: RecommendationCriteria,
  options: PlanOptions,
): RecommendationPlan {
  const dayCount = Math.max(0, Math.floor(options.days));

  // Pre-compute each slot's pool once (pools are stable across the window).
  const pools = new Map<string, CandidateMeal[]>();
  for (const slot of options.slots) {
    if (!pools.has(slot)) {
      pools.set(slot, poolForSlot(candidates, criteria, slot));
    }
  }

  const days: PlanDay[] = [];
  for (let d = 0; d < dayCount; d += 1) {
    const slots: PlanSlot[] = options.slots.map((slot) => {
      const pool = pools.get(slot) ?? [];
      if (pool.length === 0) {
        return { slot, meal: null, gap: recommendationsCopy.gapNoSafeMeal };
      }
      const meal = pool[d % pool.length];
      // Guard for noUncheckedIndexedAccess; unreachable since pool is non-empty.
      if (meal === undefined) {
        return { slot, meal: null, gap: recommendationsCopy.gapNoSafeMeal };
      }
      return { slot, meal: toSelected(meal, criteria), gap: null };
    });
    days.push({ day: d + 1, slots });
  }

  return { days };
}

/**
 * Deterministically find an alternative meal for a slot. Honours every
 * constraint (allergen-safe + criteria), excludes the current meal and any
 * `excludeIds`, and picks the first by id ascending. Returns null + a reason
 * when nothing fits.
 */
export function swapMeal(
  currentMealId: string,
  candidates: readonly CandidateMeal[],
  criteria: RecommendationCriteria,
  options: SwapOptions,
): SwapResult {
  const excluded = new Set<string>(options.excludeIds ?? []);
  excluded.add(currentMealId);

  const alternative = poolForSlot(candidates, criteria, options.slot).find(
    (meal) => !excluded.has(meal.id),
  );

  if (alternative === undefined) {
    return { meal: null, reason: recommendationsCopy.swapNoAlternative };
  }
  return { meal: toSelected(alternative, criteria), reason: null };
}
