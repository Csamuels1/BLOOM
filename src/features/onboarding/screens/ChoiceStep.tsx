import { useState } from 'react';
import { View } from 'react-native';

import { Body, Button, ChoiceCard, PageTitle } from '@/components';
import { onboardingCopy as copy } from '@/content/onboarding';
import { spacing } from '@/design/tokens';

export interface ChoiceOption<T extends string> {
  value: T;
  title: string;
  body?: string;
}

/**
 * Shared single-select onboarding step (issue #14): a heading, optional intro,
 * an accessible radio group of choices, and a Continue gated until one is
 * chosen. Steps supply their options and what to do with the choice.
 */
export function ChoiceStep<T extends string>({
  heading,
  intro,
  options,
  value,
  onContinue,
  continueLabel = copy.continue,
}: {
  heading: string;
  intro?: string;
  options: readonly ChoiceOption<T>[];
  value: T | undefined;
  onContinue: (value: T) => void;
  continueLabel?: string;
}) {
  const [selected, setSelected] = useState<T | undefined>(value);

  return (
    <View style={{ gap: spacing.lg }}>
      <PageTitle>{heading}</PageTitle>
      {intro ? <Body>{intro}</Body> : null}

      <View accessibilityRole="radiogroup" style={{ gap: spacing.md }}>
        {options.map((option) => (
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
        label={continueLabel}
        disabled={!selected}
        onPress={() => {
          if (selected) onContinue(selected);
        }}
      />
    </View>
  );
}

export default ChoiceStep;
