import { useState } from 'react';
import { View } from 'react-native';

import { Body, Button, Caption, PageTitle, TextField } from '@/components';
import { onboardingCopy as copy } from '@/content/onboarding';
import { spacing } from '@/design/tokens';

import { useOnboardingStore } from '../onboardingStore';
import { MAX_HEIGHT_CM, MIN_HEIGHT_CM } from '../schema';

/** Imperial read-out for a centimetre height, so the value stays familiar. */
function toImperial(cm: number): { feet: number; inches: number } {
  const totalInches = Math.round(cm / 2.54);
  return { feet: Math.floor(totalInches / 12), inches: totalInches % 12 };
}

/**
 * Basic stats — height (issue #15). Stored canonically in centimetres with an
 * imperial read-out; validated to a plausible adult range. The app-wide unit
 * preference is chosen on the next step.
 */
export function StatsStep() {
  const draftHeight = useOnboardingStore((state) => state.draft.heightCm);
  const patch = useOnboardingStore((state) => state.patch);
  const next = useOnboardingStore((state) => state.next);

  const [value, setValue] = useState(draftHeight ? String(draftHeight) : '');
  const [error, setError] = useState<string | null>(null);

  const parsed = Number.parseInt(value, 10);
  const valid =
    Number.isFinite(parsed) &&
    parsed >= MIN_HEIGHT_CM &&
    parsed <= MAX_HEIGHT_CM;
  const imperial = valid ? toImperial(parsed) : null;

  const onContinue = () => {
    if (!valid) {
      setError(copy.errHeightRange);
      return;
    }
    patch({ heightCm: parsed });
    next();
  };

  return (
    <View style={{ gap: spacing.lg }}>
      <PageTitle>{copy.statsHeading}</PageTitle>
      <Body>{copy.statsIntro}</Body>

      <TextField
        label={copy.heightLabel}
        placeholder={copy.heightPlaceholder}
        value={value}
        onChangeText={(text) => {
          setValue(text.replace(/[^0-9]/g, ''));
          if (error) setError(null);
        }}
        keyboardType="number-pad"
        inputMode="numeric"
        error={error ?? undefined}
      />
      {imperial ? (
        <Caption>{copy.heightImperial(imperial.feet, imperial.inches)}</Caption>
      ) : null}

      <Button label={copy.continue} onPress={onContinue} />
    </View>
  );
}

export default StatsStep;
