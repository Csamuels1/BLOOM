import { postpartumCopy } from '@/content/postpartum';

/**
 * Postpartum recovery context (issue #35).
 *
 * BLOOM serves postpartum women first and protects emotional safety above all.
 * This builds a gentle, NON-DIAGNOSTIC recovery-context note for the current
 * stage. It never diagnoses, never pressures a pace of recovery or weight change,
 * never implies a "should", and never embeds a numeric target. Loss, gain, and
 * maintenance are equal.
 *
 * DRAFT-UNTIL-REVIEW (ADR-0010): the narratives are UNREVIEWED DRAFTS pending
 * qualified clinical review. Every result is stamped `draft`, carries a
 * CONTENT_VERSION so a shown note can be audited and re-reviewed, and ships the
 * honest draft disclaimer.
 *
 * SAFETY INVARIANTS:
 *  - MISSING (null status or months) and PREFER-NOT-TO-SAY always resolve to a
 *    safe, neutral default. The stage is NEVER guessed.
 *  - An out-of-range month value is treated as missing, not clamped into a guess.
 *  - Pure and deterministic: identical inputs always yield an identical result.
 */

/** Bump when the narrative/content changes; a shown note records which produced it. */
export const CONTENT_VERSION = 'draft-2026.11';

export type PostpartumStatus =
  'postpartum' | 'not_postpartum' | 'prefer_not_to_say';

export type PostpartumStage = 'early' | 'mid' | 'later';

/** Inclusive postpartum month bounds that carry meaning (mirrors the profile). */
export const MONTHS_MIN = 0;
export const MONTHS_MAX = 24;

export interface RecoveryContextInputs {
  /** From the profile; null when unknown/unanswered. */
  readonly postpartumStatus: PostpartumStatus | null;
  /** 0–24, only meaningful when postpartum; null when unknown. */
  readonly postpartumMonths: number | null;
}

export type RecoveryContext =
  | {
      readonly kind: 'stage';
      readonly contentVersion: string;
      readonly isDraft: true;
      readonly stage: PostpartumStage;
      readonly narrative: string;
      readonly disclaimer: string;
    }
  | {
      readonly kind: 'neutral';
      readonly contentVersion: string;
      readonly isDraft: true;
      readonly stage: null;
      readonly narrative: string;
      readonly disclaimer: string;
    }
  | {
      readonly kind: 'not_applicable';
      readonly contentVersion: string;
      readonly isDraft: true;
      readonly stage: null;
      readonly narrative: string;
      readonly disclaimer: string;
    };

const STAGE_NARRATIVE: Record<PostpartumStage, string> = {
  early: postpartumCopy.narrativeEarly,
  mid: postpartumCopy.narrativeMid,
  later: postpartumCopy.narrativeLater,
};

/**
 * Map a valid month count to a gentle stage. These are soft seasons, not
 * clinical phases, and carry no pace or expectation.
 */
function stageForMonths(months: number): PostpartumStage {
  if (months <= 2) return 'early';
  if (months <= 9) return 'mid';
  return 'later';
}

/** True only for a finite, in-range, whole month value we can trust. */
function isMeaningfulMonths(months: number | null): months is number {
  return (
    months != null &&
    Number.isInteger(months) &&
    months >= MONTHS_MIN &&
    months <= MONTHS_MAX
  );
}

/** A safe, neutral default used for missing and prefer-not-to-say paths. */
function neutral(): RecoveryContext {
  return {
    kind: 'neutral',
    contentVersion: CONTENT_VERSION,
    isDraft: true,
    stage: null,
    narrative: postpartumCopy.narrativeNeutral,
    disclaimer: postpartumCopy.draftDisclaimer,
  };
}

/**
 * Build the gentle recovery-context note. Pure: no I/O, no randomness, no clock.
 */
export function buildRecoveryContext(
  inputs: RecoveryContextInputs,
): RecoveryContext {
  const { postpartumStatus, postpartumMonths } = inputs;

  // Not postpartum: a warm, neutral note with nothing implied.
  if (postpartumStatus === 'not_postpartum') {
    return {
      kind: 'not_applicable',
      contentVersion: CONTENT_VERSION,
      isDraft: true,
      stage: null,
      narrative: postpartumCopy.narrativeNotApplicable,
      disclaimer: postpartumCopy.draftDisclaimer,
    };
  }

  // Postpartum with a trustworthy month value: a gentle, stage-appropriate note.
  // The stage is only ever derived from a value we have — never guessed.
  if (
    postpartumStatus === 'postpartum' &&
    isMeaningfulMonths(postpartumMonths)
  ) {
    const stage = stageForMonths(postpartumMonths);
    return {
      kind: 'stage',
      contentVersion: CONTENT_VERSION,
      isDraft: true,
      stage,
      narrative: STAGE_NARRATIVE[stage],
      disclaimer: postpartumCopy.draftDisclaimer,
    };
  }

  // Everything else — prefer-not-to-say, missing status, or postpartum with no
  // (or an out-of-range) month value — resolves to the safe neutral default.
  return neutral();
}

export default buildRecoveryContext;
