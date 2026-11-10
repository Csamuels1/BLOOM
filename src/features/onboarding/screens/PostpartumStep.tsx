import { onboardingCopy as copy } from '@/content/onboarding';

import { useOnboardingStore } from '../onboardingStore';
import type { PostpartumStatus } from '../schema';
import { ChoiceStep } from './ChoiceStep';

const OPTIONS: { value: PostpartumStatus; title: string }[] = [
  { value: 'postpartum', title: copy.postpartumYes },
  { value: 'not_postpartum', title: copy.postpartumNo },
  { value: 'prefer_not_to_say', title: copy.postpartumPreferNot },
];

/**
 * Postpartum status (issue #14). "Prefer not to say" is a first-class, usable
 * option. Only a postpartum answer reveals the months step (see steps.ts).
 */
export function PostpartumStep() {
  const status = useOnboardingStore((state) => state.draft.postpartumStatus);
  const patch = useOnboardingStore((state) => state.patch);
  const next = useOnboardingStore((state) => state.next);

  return (
    <ChoiceStep
      heading={copy.postpartumHeading}
      intro={copy.postpartumIntro}
      options={OPTIONS}
      value={status}
      onContinue={(choice) => {
        patch({ postpartumStatus: choice });
        next();
      }}
    />
  );
}

export default PostpartumStep;
