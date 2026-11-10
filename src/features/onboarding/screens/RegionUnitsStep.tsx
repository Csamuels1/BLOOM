import { useState } from 'react';
import { View } from 'react-native';

import { Body, Button, Caption, ChoiceCard, PageTitle } from '@/components';
import { onboardingCopy as copy } from '@/content/onboarding';
import { spacing } from '@/design/tokens';

import { localeDefaults } from '../locale';
import { useOnboardingStore } from '../onboardingStore';
import type { UnitSystem } from '../schema';

const COUNTRIES = [
  { value: 'NG', title: copy.countryNigeria },
  { value: 'US', title: copy.countryUnitedStates },
] as const;

const UNITS: { value: UnitSystem; title: string }[] = [
  { value: 'metric', title: copy.unitMetric },
  { value: 'imperial', title: copy.unitImperial },
];

/**
 * Region and units (issue #15). Defaults come from the OS locale (never GPS or
 * precise location) and are fully overridable. Only a two-letter country code
 * is stored.
 */
export function RegionUnitsStep() {
  const draft = useOnboardingStore((state) => state.draft);
  const patch = useOnboardingStore((state) => state.patch);
  const next = useOnboardingStore((state) => state.next);

  const defaults = localeDefaults();
  const defaultCountry = COUNTRIES.some((c) => c.value === defaults.countryCode)
    ? defaults.countryCode
    : undefined;

  const [country, setCountry] = useState<string | undefined>(
    draft.countryCode ?? defaultCountry,
  );
  const [unitSystem, setUnitSystem] = useState<UnitSystem>(
    draft.unitSystem ?? defaults.unitSystem,
  );

  return (
    <View style={{ gap: spacing.lg }}>
      <PageTitle>{copy.regionHeading}</PageTitle>
      <Body>{copy.regionIntro}</Body>

      <View accessibilityRole="radiogroup" style={{ gap: spacing.md }}>
        {COUNTRIES.map((option) => (
          <ChoiceCard
            key={option.value}
            title={option.title}
            selected={country === option.value}
            onSelect={() => setCountry(option.value)}
          />
        ))}
      </View>

      <Caption>{copy.unitsLabel}</Caption>
      <View accessibilityRole="radiogroup" style={{ gap: spacing.md }}>
        {UNITS.map((option) => (
          <ChoiceCard
            key={option.value}
            title={option.title}
            selected={unitSystem === option.value}
            onSelect={() => setUnitSystem(option.value)}
          />
        ))}
      </View>

      <Button
        label={copy.continue}
        disabled={!country}
        onPress={() => {
          if (!country) return;
          patch({ countryCode: country, unitSystem });
          next();
        }}
      />
    </View>
  );
}

export default RegionUnitsStep;
