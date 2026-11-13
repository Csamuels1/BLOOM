import { planCopy } from '@/content/plan';

/**
 * Calorie-range plan calculator (issue #32).
 *
 * BLOOM never diagnoses and never prescribes a single number. This computes a
 * gentle RANGE to explore, as a deterministic, versioned, auditable draft. Every
 * result carries the formula and content versions so a saved plan can be audited
 * and re-reviewed; the adjustments list makes the range reviewable (each factor
 * and its contribution is explicit). The formula itself is a DRAFT pending the
 * qualified dietitian review at #33.
 *
 * SAFETY INVARIANTS:
 *  - During pregnancy, NO targets are ever generated (a care boundary, checked
 *    first, before anything else).
 *  - Output is always a range (min < max), never a single prescriptive figure.
 */

/** Bump when the formula changes; a saved plan records which produced it. */
export const FORMULA_VERSION = 'draft-2026.11';
/** Bump when the narrative/content changes. */
export const CONTENT_VERSION = 'draft-2026.11';

export type Goal = 'loss' | 'maintenance' | 'gain';
export type FeedingContext =
  'breastfeeding' | 'mixed' | 'formula' | 'not_feeding' | 'prefer_not_to_say';

export interface PlanInputs {
  goal: Goal;
  /** Pregnancy is a hard stop — no targets are generated. */
  isPregnant: boolean;
  feedingContext?: FeedingContext | null;
}

export interface CalorieRange {
  readonly min: number;
  readonly max: number;
}

/** One auditable factor that shaped the range; the range is the sum of these. */
export interface Adjustment {
  readonly id: string;
  readonly label: string;
  readonly appliedMin: number;
  readonly appliedMax: number;
}

export type PlanResult =
  | {
      readonly kind: 'no_target';
      readonly formulaVersion: string;
      readonly contentVersion: string;
      readonly reason: string;
    }
  | {
      readonly kind: 'range';
      readonly formulaVersion: string;
      readonly contentVersion: string;
      readonly range: CalorieRange;
      readonly narrative: string;
      readonly adjustments: readonly Adjustment[];
    };

/** Illustrative DRAFT base ranges by goal (not per-user; pending review). */
const BASE_RANGES: Record<Goal, CalorieRange> = {
  loss: { min: 1600, max: 2000 },
  maintenance: { min: 1800, max: 2200 },
  gain: { min: 2000, max: 2400 },
};

const BASE_LABEL: Record<Goal, string> = {
  loss: planCopy.adjustmentBaseLoss,
  maintenance: planCopy.adjustmentBaseMaintenance,
  gain: planCopy.adjustmentBaseGain,
};

const NARRATIVE: Record<Goal, string> = {
  loss: planCopy.narrativeLoss,
  maintenance: planCopy.narrativeMaintenance,
  gain: planCopy.narrativeGain,
};

/** Draft breastfeeding energy allowance (reviewable). Mixed feeding is lighter. */
const FEEDING_ALLOWANCE: Partial<
  Record<FeedingContext, { min: number; max: number }>
> = {
  breastfeeding: { min: 330, max: 500 },
  mixed: { min: 165, max: 250 },
};

/**
 * Compute a gentle calorie range (or no target, during pregnancy). Pure and
 * deterministic: identical inputs always yield an identical result.
 */
export function computePlan(inputs: PlanInputs): PlanResult {
  // SAFETY: pregnancy never generates targets. Checked before anything else.
  if (inputs.isPregnant) {
    return {
      kind: 'no_target',
      formulaVersion: FORMULA_VERSION,
      contentVersion: CONTENT_VERSION,
      reason: planCopy.pregnancyNoTargetBody,
    };
  }

  const base = BASE_RANGES[inputs.goal];
  const adjustments: Adjustment[] = [
    {
      id: 'goal',
      label: BASE_LABEL[inputs.goal],
      appliedMin: base.min,
      appliedMax: base.max,
    },
  ];

  const allowance = inputs.feedingContext
    ? FEEDING_ALLOWANCE[inputs.feedingContext]
    : undefined;
  if (allowance) {
    adjustments.push({
      id: 'feeding',
      label: planCopy.adjustmentBreastfeeding,
      appliedMin: allowance.min,
      appliedMax: allowance.max,
    });
  }

  // The range is exactly the sum of its adjustments, so it is fully auditable.
  const range: CalorieRange = {
    min: adjustments.reduce((sum, a) => sum + a.appliedMin, 0),
    max: adjustments.reduce((sum, a) => sum + a.appliedMax, 0),
  };

  return {
    kind: 'range',
    formulaVersion: FORMULA_VERSION,
    contentVersion: CONTENT_VERSION,
    range,
    narrative: NARRATIVE[inputs.goal],
    adjustments,
  };
}
