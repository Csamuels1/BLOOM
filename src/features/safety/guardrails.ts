import { safetyCopy } from '@/content/safety';

/**
 * Safety guardrails (issue #47, Phase 11).
 *
 * Conservative, protective boundaries that err toward care. They are versioned
 * so a saved plan records which thresholds applied, and gentle: a floor is a
 * minimum to stay above, a pace is a gentle ceiling — never a target to beat.
 *
 * These are intentionally pure and dependency-light (no plan types) so the plan
 * calculator can apply the floor without a circular import, and any screen that
 * sets a loss pace can route through the same check. The specific values are
 * standard conservative public-health boundaries, pending clinical sign-off
 * (#50); enforcing them is the safe default and never waits on that review.
 */

/** Bump when any guardrail threshold changes; a saved plan records this. */
export const GUARDRAIL_VERSION = 'safety-2026.11';

/** No plan ever suggests below this many calories (a nourishing minimum). */
export const SAFE_CALORIE_FLOOR = 1200;

/** Loss is never paced faster than this many kg per week (a gentle ceiling). */
export const MAX_SAFE_WEEKLY_LOSS_KG = 1;

export interface FlooredRange {
  readonly min: number;
  readonly max: number;
  /** How much the floor raised the minimum (0 when it was already safe). */
  readonly raisedBy: number;
}

/**
 * Raise a calorie range to the safe floor. Only ever raises — it never lowers a
 * value, so goals already above the floor (maintenance, gain) are untouched. The
 * max is kept at or above the min so the range stays valid.
 */
export function applyCalorieFloor(range: {
  min: number;
  max: number;
}): FlooredRange {
  const raisedBy = Math.max(0, SAFE_CALORIE_FLOOR - range.min);
  const min = Math.max(range.min, SAFE_CALORIE_FLOOR);
  const max = Math.max(range.max, min);
  return { min, max, raisedBy };
}

export type LossPaceResult =
  | { readonly ok: true; readonly kgPerWeek: number; readonly note: string }
  | {
      readonly ok: false;
      readonly requestedKgPerWeek: number;
      readonly safeKgPerWeek: number;
      readonly title: string;
      readonly body: string;
    };

/**
 * Evaluate a requested weekly loss pace. A pace at or below the ceiling is
 * accepted; a faster one is gently redirected to the safe maximum. This applies
 * only to loss guidance — other goals never call it, and it never constrains
 * them. A non-finite request is treated as no pace (accepted at 0).
 */
export function evaluateLossPace(requestedKgPerWeek: number): LossPaceResult {
  if (!Number.isFinite(requestedKgPerWeek)) {
    return { ok: true, kgPerWeek: 0, note: safetyCopy.lossPaceSafeNote };
  }
  if (requestedKgPerWeek <= MAX_SAFE_WEEKLY_LOSS_KG) {
    return {
      ok: true,
      kgPerWeek: Math.max(0, requestedKgPerWeek),
      note: safetyCopy.lossPaceSafeNote,
    };
  }
  return {
    ok: false,
    requestedKgPerWeek,
    safeKgPerWeek: MAX_SAFE_WEEKLY_LOSS_KG,
    title: safetyCopy.lossPaceRedirectTitle,
    body: safetyCopy.lossPaceRedirectBody,
  };
}
