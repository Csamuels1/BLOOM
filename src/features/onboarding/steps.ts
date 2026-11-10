import type { OnboardingDraft } from './schema';

/**
 * Onboarding flow definition (issue #12).
 *
 * The step list and their availability predicates ARE the flow: screens (added
 * in #13–#15) render a step by id, while order and conditional navigation live
 * here and are unit-tested without any UI. A current pregnancy terminates at the
 * care boundary — none of the weight-oriented steps are available — so BLOOM
 * never produces a pregnancy weight-target plan (docs/PRODUCT_BRIEF.md).
 */
export interface StepDef {
  id: string;
  /** Optional steps can be skipped without entering data. */
  optional?: boolean;
  /** Conditional navigation: a step is reachable only when this holds. */
  available?: (draft: OnboardingDraft) => boolean;
}

const notPregnant = (d: OnboardingDraft): boolean => d.isPregnant !== true;

export const ONBOARDING_STEPS = [
  { id: 'welcome' },
  { id: 'goal' },
  { id: 'pregnancy' },
  { id: 'pregnancy-boundary', available: (d) => d.isPregnant === true },
  { id: 'postpartum', available: notPregnant },
  {
    id: 'postpartum-months',
    available: (d) => notPregnant(d) && d.postpartumStatus === 'postpartum',
  },
  {
    id: 'feeding',
    optional: true,
    available: (d) => notPregnant(d) && d.postpartumStatus === 'postpartum',
  },
  { id: 'stats', available: notPregnant },
  { id: 'region-units', available: notPregnant },
  { id: 'dietary-allergens', available: notPregnant },
  { id: 'cycle', optional: true, available: notPregnant },
  { id: 'preview', available: notPregnant },
] as const satisfies readonly StepDef[];

export type OnboardingStepId = (typeof ONBOARDING_STEPS)[number]['id'];

function def(id: OnboardingStepId): StepDef {
  const found = ONBOARDING_STEPS.find((step) => step.id === id);
  if (!found) throw new Error(`Unknown onboarding step: ${id}`);
  return found;
}

/** Steps reachable given the current draft, in flow order. */
export function visibleStepIds(draft: OnboardingDraft): OnboardingStepId[] {
  return ONBOARDING_STEPS.filter(
    (step) => !('available' in step) || step.available(draft),
  ).map((step) => step.id);
}

export function firstStepId(): OnboardingStepId {
  return ONBOARDING_STEPS[0].id;
}

/** The next reachable step after `current`, or null at the end of the flow. */
export function nextStepId(
  current: OnboardingStepId,
  draft: OnboardingDraft,
): OnboardingStepId | null {
  const visible = visibleStepIds(draft);
  const index = visible.indexOf(current);
  if (index === -1) return null;
  return visible[index + 1] ?? null;
}

/** The previous reachable step before `current`, or null at the start. */
export function prevStepId(
  current: OnboardingStepId,
  draft: OnboardingDraft,
): OnboardingStepId | null {
  const visible = visibleStepIds(draft);
  const index = visible.indexOf(current);
  if (index <= 0) return null;
  return visible[index - 1] ?? null;
}

export function isOptionalStep(id: OnboardingStepId): boolean {
  return def(id).optional === true;
}

/** True once there are no further reachable steps (flow terminus). */
export function isLastStep(
  current: OnboardingStepId,
  draft: OnboardingDraft,
): boolean {
  return nextStepId(current, draft) === null;
}
