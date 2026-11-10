import { onboardingCopy as copy } from '@/content/onboarding';

import { useOnboardingStore } from '../onboardingStore';
import { ChoiceStep } from './ChoiceStep';

const OPTIONS = [
  { value: 'yes', title: copy.pregnancyYes },
  { value: 'no', title: copy.pregnancyNo },
] as const;

/**
 * Pregnancy question (issue #14). A current pregnancy routes to the care
 * boundary (see steps.ts); "No" continues to the postpartum question.
 */
export function PregnancyStep() {
  const isPregnant = useOnboardingStore((state) => state.draft.isPregnant);
  const patch = useOnboardingStore((state) => state.patch);
  const next = useOnboardingStore((state) => state.next);

  const value =
    isPregnant === undefined ? undefined : isPregnant ? 'yes' : 'no';

  return (
    <ChoiceStep
      heading={copy.pregnancyHeading}
      intro={copy.pregnancyIntro}
      options={OPTIONS}
      value={value}
      onContinue={(choice) => {
        patch({ isPregnant: choice === 'yes' });
        next();
      }}
    />
  );
}

export default PregnancyStep;
