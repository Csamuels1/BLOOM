import { useState } from 'react';
import { View } from 'react-native';

import {
  Body,
  Button,
  Caption,
  ChoiceCard,
  PageTitle,
  SafetyNotice,
} from '@/components';
import { onboardingCopy as copy } from '@/content/onboarding';
import { spacing } from '@/design/tokens';

import { useOnboardingStore } from '../onboardingStore';

const DIETARY = [
  { value: 'vegetarian', title: copy.dietaryVegetarian },
  { value: 'vegan', title: copy.dietaryVegan },
  { value: 'pescatarian', title: copy.dietaryPescatarian },
  { value: 'halal', title: copy.dietaryHalal },
  { value: 'low_dairy', title: copy.dietaryLowDairy },
] as const;

const ALLERGENS = [
  { value: 'peanut', title: copy.allergenPeanut },
  { value: 'tree_nut', title: copy.allergenTreeNut },
  { value: 'milk', title: copy.allergenMilk },
  { value: 'egg', title: copy.allergenEgg },
  { value: 'soy', title: copy.allergenSoy },
  { value: 'wheat', title: copy.allergenWheat },
  { value: 'fish', title: copy.allergenFish },
  { value: 'shellfish', title: copy.allergenShellfish },
] as const;

function toggle(list: string[], value: string): string[] {
  return list.includes(value)
    ? list.filter((item) => item !== value)
    : [...list, value];
}

/**
 * Dietary preferences and allergens (issue #15). Both optional multi-selects; a
 * disclaimer makes clear allergen tags are a filter, not medical advice, and do
 * not replace reading labels (safety, non-diagnostic per ADR-0003).
 */
export function DietaryAllergensStep() {
  const draft = useOnboardingStore((state) => state.draft);
  const patch = useOnboardingStore((state) => state.patch);
  const next = useOnboardingStore((state) => state.next);

  const [dietary, setDietary] = useState<string[]>(
    draft.dietaryPreferences ?? [],
  );
  const [allergens, setAllergens] = useState<string[]>(draft.allergens ?? []);

  return (
    <View style={{ gap: spacing.lg }}>
      <PageTitle>{copy.dietaryHeading}</PageTitle>
      <Body>{copy.dietaryIntro}</Body>

      <Caption>{copy.dietaryLabel}</Caption>
      <View style={{ gap: spacing.md }}>
        {DIETARY.map((option) => (
          <ChoiceCard
            key={option.value}
            role="checkbox"
            title={option.title}
            selected={dietary.includes(option.value)}
            onSelect={() => setDietary((list) => toggle(list, option.value))}
          />
        ))}
      </View>

      <Caption>{copy.allergensLabel}</Caption>
      <View style={{ gap: spacing.md }}>
        {ALLERGENS.map((option) => (
          <ChoiceCard
            key={option.value}
            role="checkbox"
            title={option.title}
            selected={allergens.includes(option.value)}
            onSelect={() => setAllergens((list) => toggle(list, option.value))}
          />
        ))}
      </View>

      <SafetyNotice
        title={copy.allergensLabel}
        message={copy.allergenDisclaimer}
      />

      <Button
        label={copy.continue}
        onPress={() => {
          patch({ dietaryPreferences: dietary, allergens });
          next();
        }}
      />
    </View>
  );
}

export default DietaryAllergensStep;
