import type { OnboardingDraft } from '@/features/onboarding/schema';
import {
  isLastStep,
  isOptionalStep,
  nextStepId,
  prevStepId,
  visibleStepIds,
} from '@/features/onboarding/steps';

describe('onboarding conditional navigation', () => {
  it('hides the pregnancy boundary and the conditional steps before anything is answered', () => {
    const visible = visibleStepIds({});
    expect(visible).toContain('pregnancy');
    expect(visible).not.toContain('pregnancy-boundary');
    expect(visible).not.toContain('postpartum-months');
    expect(visible).not.toContain('feeding');
  });

  it('routes a pregnant user to the care boundary and nowhere else', () => {
    const draft: OnboardingDraft = { isPregnant: true };
    const visible = visibleStepIds(draft);

    expect(visible).toEqual([
      'welcome',
      'goal',
      'pregnancy',
      'pregnancy-boundary',
    ]);
    // No weight-oriented steps are reachable (no pregnancy weight-target plan).
    expect(visible).not.toContain('stats');
    expect(visible).not.toContain('preview');
    expect(nextStepId('pregnancy', draft)).toBe('pregnancy-boundary');
    expect(isLastStep('pregnancy-boundary', draft)).toBe(true);
  });

  it('skips the boundary for a non-pregnant user', () => {
    const draft: OnboardingDraft = { isPregnant: false };
    const visible = visibleStepIds(draft);
    expect(visible).not.toContain('pregnancy-boundary');
    expect(nextStepId('pregnancy', draft)).toBe('postpartum');
  });

  it('shows postpartum months and feeding only when postpartum', () => {
    const postpartum: OnboardingDraft = {
      isPregnant: false,
      postpartumStatus: 'postpartum',
    };
    expect(visibleStepIds(postpartum)).toContain('postpartum-months');
    expect(visibleStepIds(postpartum)).toContain('feeding');
    expect(nextStepId('postpartum', postpartum)).toBe('postpartum-months');

    const notPostpartum: OnboardingDraft = {
      isPregnant: false,
      postpartumStatus: 'not_postpartum',
    };
    expect(visibleStepIds(notPostpartum)).not.toContain('postpartum-months');
    expect(visibleStepIds(notPostpartum)).not.toContain('feeding');
    // Conditional navigation jumps straight to stats.
    expect(nextStepId('postpartum', notPostpartum)).toBe('stats');
  });

  it('supports back navigation along the visible path', () => {
    const draft: OnboardingDraft = { isPregnant: false };
    expect(prevStepId('postpartum', draft)).toBe('pregnancy');
    expect(prevStepId('welcome', draft)).toBeNull();
  });

  it('marks feeding and cycle as optional (skippable) and others required', () => {
    expect(isOptionalStep('feeding')).toBe(true);
    expect(isOptionalStep('cycle')).toBe(true);
    expect(isOptionalStep('goal')).toBe(false);
    expect(isOptionalStep('stats')).toBe(false);
  });

  it('ends the flow at the preview for a complete non-pregnant path', () => {
    const draft: OnboardingDraft = { isPregnant: false };
    expect(isLastStep('preview', draft)).toBe(true);
  });
});
