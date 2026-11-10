import { router } from 'expo-router';
import { View } from 'react-native';

import {
  Body,
  Button,
  Card,
  Caption,
  Display,
  PageTitle,
  SafetyNotice,
  SectionTitle,
} from '@/components';
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
 * Plan reveal and onboarding finish (issue #16). Narrative-led and gentle:
 * words first, then a sample calorie *range* (illustrative only — never a
 * per-user calculation; real guidance is professionally reviewed, Phase 7/11),
 * three mock regional meals, and a CTA. Entirely local — no backend access on
 * any path. Persisting the draft to a profile is Phase 4.
 */
export function PreviewStep() {
  const draft = useOnboardingStore((state) => state.draft);

  const meals =
    draft.countryCode === 'NG'
      ? [copy.mealNigeria1, copy.mealNigeria2, copy.mealNigeria3]
      : [copy.mealGeneral1, copy.mealGeneral2, copy.mealGeneral3];

  return (
    <View style={{ gap: spacing.lg }}>
      <PageTitle>{copy.planHeading}</PageTitle>
      {/* Narrative leads — a number is never the first thing shown. */}
      <Body>{copy.planNarrative}</Body>

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

      <Card>
        <Caption>{copy.planRangeLabel}</Caption>
        <Display>{copy.planRange}</Display>
      </Card>
      <SafetyNotice title={copy.planRangeLabel} message={copy.planRangeNote} />

      <SectionTitle>{copy.planMealsLabel}</SectionTitle>
      <View style={{ gap: spacing.md }}>
        {meals.map((meal) => (
          <Card key={meal}>
            <Body>{meal}</Body>
          </Card>
        ))}
      </View>

      <Button label={copy.planCta} onPress={() => router.replace('/')} />
    </View>
  );
}

export default PreviewStep;
