import { postpartumCopy } from '@/content/postpartum';

/**
 * Postpartum feeding energy adjustments (issue #35), as VERSIONED draft data.
 *
 * These are the approved(DRAFT) gentle energy allowances by feeding context. They
 * are kept CONSISTENT with the plan calculator's breastfeeding/mixed draft
 * allowance (src/features/plan/calculator.ts, read-only) but live here so this
 * module owns the postpartum story and can be reviewed and re-versioned on its
 * own.
 *
 * DRAFT-UNTIL-REVIEW (ADR-0010): these are UNREVIEWED DRAFT estimates pending
 * qualified dietitian review, NOT validated clinical guidance. Each entry carries
 * an honest, reviewable reason. The allowances are gentle ranges to explore, never
 * requirements, and they never express a "should" or a pace.
 *
 * SAFETY INVARIANTS:
 *  - Every allowance is non-negative (min >= 0, max >= min).
 *  - No feeding context is penalized; the non-feeding contexts are a neutral 0.
 *  - Pure data + pure lookups: no I/O, no randomness, deterministic.
 */

/** Bump when any allowance value or reason changes; a saved plan records this. */
export const ADJUSTMENTS_VERSION = 'draft-2026.11';

export type FeedingContext =
  'breastfeeding' | 'mixed' | 'formula' | 'not_feeding' | 'prefer_not_to_say';

/** A gentle, non-negative draft energy allowance range (kcal). */
export interface FeedingAllowance {
  readonly min: number;
  readonly max: number;
}

/** One versioned, reviewable feeding adjustment entry. */
export interface FeedingAdjustment {
  readonly feedingContext: FeedingContext;
  /** Gentle draft allowance range. A neutral 0–0 means no allowance applied. */
  readonly allowance: FeedingAllowance;
  /** Honest, reviewable reason for this entry (never a "should"). */
  readonly reason: string;
  /** Always true until a reviewer activates this content. */
  readonly isDraft: true;
}

/**
 * The full versioned table. Breastfeeding/mixed mirror the calculator's draft
 * allowance (breastfeeding 330–500, mixed 165–250); the non-feeding contexts are
 * a neutral 0–0 so no way of feeding is ever treated as a shortfall.
 */
export const FEEDING_ADJUSTMENTS: Readonly<
  Record<FeedingContext, FeedingAdjustment>
> = {
  breastfeeding: {
    feedingContext: 'breastfeeding',
    allowance: { min: 330, max: 500 },
    reason: postpartumCopy.reasonBreastfeeding,
    isDraft: true,
  },
  mixed: {
    feedingContext: 'mixed',
    allowance: { min: 165, max: 250 },
    reason: postpartumCopy.reasonMixed,
    isDraft: true,
  },
  formula: {
    feedingContext: 'formula',
    allowance: { min: 0, max: 0 },
    reason: postpartumCopy.reasonFormula,
    isDraft: true,
  },
  not_feeding: {
    feedingContext: 'not_feeding',
    allowance: { min: 0, max: 0 },
    reason: postpartumCopy.reasonNotFeeding,
    isDraft: true,
  },
  prefer_not_to_say: {
    feedingContext: 'prefer_not_to_say',
    allowance: { min: 0, max: 0 },
    reason: postpartumCopy.reasonPreferNot,
    isDraft: true,
  },
} as const;

/**
 * Look up the versioned draft adjustment for a feeding context. A missing (null)
 * context resolves to the safe prefer-not-to-say entry — a neutral 0 allowance,
 * never a guess. Pure and deterministic.
 */
export function getFeedingAdjustment(
  feedingContext: FeedingContext | null,
): FeedingAdjustment {
  return FEEDING_ADJUSTMENTS[feedingContext ?? 'prefer_not_to_say'];
}

export default FEEDING_ADJUSTMENTS;
