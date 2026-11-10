import { onboardingCopy as copy } from '@/content/onboarding';

import { useOnboardingStore } from '../onboardingStore';
import { ChoiceStep } from './ChoiceStep';

const OPTIONS = [
  { value: 'yes', title: copy.cycleYes },
  { value: 'no', title: copy.cycleNo },
] as const;

/**
 * Optional cycle context (issue #15). Skippable via the host; "No" simply means
 * not now. Nothing here enables tracking on its own — it records a preference.
 */
export function CycleStep() {
  const trackCycle = useOnboardingStore((state) => state.draft.trackCycle);
  const patch = useOnboardingStore((state) => state.patch);
  const next = useOnboardingStore((state) => state.next);

  const value =
    trackCycle === undefined ? undefined : trackCycle ? 'yes' : 'no';

  return (
    <ChoiceStep
      heading={copy.cycleHeading}
      intro={copy.cycleIntro}
      options={OPTIONS}
      value={value}
      onContinue={(choice) => {
        patch({ trackCycle: choice === 'yes' });
        next();
      }}
    />
  );
}

export default CycleStep;
