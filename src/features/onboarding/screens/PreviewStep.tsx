import { router } from 'expo-router';
import { View } from 'react-native';

import { Body, Button, Caption, PageTitle } from '@/components';
import { onboardingCopy as copy } from '@/content/onboarding';
import { spacing } from '@/design/tokens';

import { useOnboardingStore } from '../onboardingStore';
import type { Goal, UnitSystem } from '../schema';

const GOAL_LABELS: Record<Goal, string> = {
  loss: copy.goalLossTitle,
  maintenance: copy.goalMaintainTitle,
  gain: copy.goalGainTitle,
};

const COUNTRY_LABELS: Record<string, string> = {
  NG: copy.countryNigeria,
  US: copy.countryUnitedStates,
};

const UNIT_LABELS: Record<UnitSystem, string> = {
  metric: copy.unitMetric,
  imperial: copy.unitImperial,
};

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ gap: spacing.xs }}>
      <Caption>{label}</Caption>
      <Body>{value}</Body>
    </View>
  );
}

/**
 * Plan preview / finish (issue #15). Summarizes the draft and completes
 * onboarding by returning to the app. The draft stays on-device; persisting it
 * to a profile is Phase 4.
 */
export function PreviewStep() {
  const draft = useOnboardingStore((state) => state.draft);

  return (
    <View style={{ gap: spacing.lg }}>
      <PageTitle>{copy.previewHeading}</PageTitle>
      <Body>{copy.previewIntro}</Body>

      <SummaryRow
        label={copy.previewGoalLabel}
        value={draft.goal ? GOAL_LABELS[draft.goal] : copy.previewNotSet}
      />
      <SummaryRow
        label={copy.previewRegionLabel}
        value={
          draft.countryCode
            ? (COUNTRY_LABELS[draft.countryCode] ?? draft.countryCode)
            : copy.previewNotSet
        }
      />
      <SummaryRow
        label={copy.previewUnitsLabel}
        value={
          draft.unitSystem ? UNIT_LABELS[draft.unitSystem] : copy.previewNotSet
        }
      />

      <Button label={copy.previewFinish} onPress={() => router.replace('/')} />
    </View>
  );
}

export default PreviewStep;
