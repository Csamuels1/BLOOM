import { onboardingCopy as copy } from '@/content/onboarding';

import { useOnboardingStore } from '../onboardingStore';
import type { FeedingContext } from '../schema';
import { ChoiceStep } from './ChoiceStep';

const OPTIONS: { value: FeedingContext; title: string }[] = [
  { value: 'breastfeeding', title: copy.feedingBreastfeeding },
  { value: 'mixed', title: copy.feedingMixed },
  { value: 'formula', title: copy.feedingFormula },
  { value: 'not_feeding', title: copy.feedingNotFeeding },
  { value: 'prefer_not_to_say', title: copy.feedingPreferNot },
];

/**
 * Feeding context (issue #14). Optional — the host offers Skip — and never used
 * to judge. "Prefer not to say" is a usable choice.
 */
export function FeedingStep() {
  const feeding = useOnboardingStore((state) => state.draft.feedingContext);
  const patch = useOnboardingStore((state) => state.patch);
  const next = useOnboardingStore((state) => state.next);

  return (
    <ChoiceStep
      heading={copy.feedingHeading}
      intro={copy.feedingIntro}
      options={OPTIONS}
      value={feeding}
      onContinue={(choice) => {
        patch({ feedingContext: choice });
        next();
      }}
    />
  );
}

export default FeedingStep;
