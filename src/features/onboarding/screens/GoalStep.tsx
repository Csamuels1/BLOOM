import { useState } from 'react';
import { View } from 'react-native';

import { Body, Button, ChoiceCard, PageTitle } from '@/components';
import { onboardingCopy as copy } from '@/content/onboarding';
import { spacing } from '@/design/tokens';

import { useOnboardingStore } from '../onboardingStore';
import type { Goal } from '../schema';

const GOAL_OPTIONS: { value: Goal; title: string; body: string }[] = [
  { value: 'loss', title: copy.goalLossTitle, body: copy.goalLossBody },
  {
    value: 'maintenance',
    title: copy.goalMaintainTitle,
    body: copy.goalMaintainBody,
  },
  { value: 'gain', title: copy.goalGainTitle, body: copy.goalGainBody },
];

/**
 * Goal selection: three equal, gently-worded cards (loss / maintenance / gain).
 * No BMI chart or scale imagery (issue #13). Loss, gain, and maintenance are
 * first-class, equal choices (docs/PRODUCT_BRIEF.md).
 */
export function GoalStep() {
  const draftGoal = useOnboardingStore((state) => state.draft.goal);
  const patch = useOnboardingStore((state) => state.patch);
  const next = useOnboardingStore((state) => state.next);
  const [selected, setSelected] = useState<Goal | undefined>(draftGoal);

  const onContinue = () => {
    if (!selected) return;
    patch({ goal: selected });
    next();
  };

  return (
    <View style={{ gap: spacing.lg }}>
      <PageTitle>{copy.goalHeading}</PageTitle>
      <Body>{copy.goalIntro}</Body>

      <View accessibilityRole="radiogroup" style={{ gap: spacing.md }}>
        {GOAL_OPTIONS.map((option) => (
          <ChoiceCard
            key={option.value}
            title={option.title}
            body={option.body}
            selected={selected === option.value}
            onSelect={() => setSelected(option.value)}
          />
        ))}
      </View>

      <Button
        label={copy.goalContinue}
        onPress={onContinue}
        disabled={!selected}
      />
    </View>
  );
}

export default GoalStep;
