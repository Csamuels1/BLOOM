import { useState } from 'react';
import { View } from 'react-native';

import { Body, Button, PageTitle, Typography } from '@/components';
import { onboardingCopy as copy } from '@/content/onboarding';
import { spacing } from '@/design/tokens';

import { useOnboardingStore } from '../onboardingStore';
import { MAX_POSTPARTUM_MONTHS } from '../schema';

const DEFAULT_MONTHS = 3;

/**
 * Postpartum months (issue #14, conditional on a postpartum answer). A stepper
 * keeps input simple and accessible — a rough number is fine — and clamps to
 * 0–24 months, the range the MVP contextualizes.
 */
export function PostpartumMonthsStep() {
  const draftMonths = useOnboardingStore(
    (state) => state.draft.postpartumMonths,
  );
  const patch = useOnboardingStore((state) => state.patch);
  const next = useOnboardingStore((state) => state.next);
  const [months, setMonths] = useState(draftMonths ?? DEFAULT_MONTHS);

  const clamp = (value: number) =>
    Math.max(0, Math.min(MAX_POSTPARTUM_MONTHS, value));
  const unit = months === 1 ? copy.monthsUnitOne : copy.monthsUnitMany;

  return (
    <View style={{ gap: spacing.lg }}>
      <PageTitle>{copy.monthsHeading}</PageTitle>
      <Body>{copy.monthsIntro}</Body>

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: spacing.xl,
        }}
      >
        <Button
          label="−"
          variant="secondary"
          accessibilityLabel={copy.monthsDecrease}
          disabled={months <= 0}
          onPress={() => setMonths((value) => clamp(value - 1))}
        />
        <Typography
          variant="display"
          accessibilityLiveRegion="polite"
          accessibilityLabel={`${months} ${unit}`}
        >
          {`${months} ${unit}`}
        </Typography>
        <Button
          label="+"
          variant="secondary"
          accessibilityLabel={copy.monthsIncrease}
          disabled={months >= MAX_POSTPARTUM_MONTHS}
          onPress={() => setMonths((value) => clamp(value + 1))}
        />
      </View>

      <Button
        label={copy.continue}
        onPress={() => {
          patch({ postpartumMonths: months });
          next();
        }}
      />
    </View>
  );
}

export default PostpartumMonthsStep;
