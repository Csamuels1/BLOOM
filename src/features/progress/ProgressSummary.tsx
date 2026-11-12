import { View } from 'react-native';

import { Body, Caption, SectionTitle } from '@/components';
import { progressCopy as copy } from '@/content/progress';
import { spacing } from '@/design/tokens';
import { formatWeight, type UnitSystem } from '@/features/weight';

import type { TrendSummary } from './weeklyAverages';

/** The neutral, non-judgmental sentence for a trend direction. */
export function directionSentence(
  direction: TrendSummary['direction'],
): string {
  switch (direction) {
    case 'down':
      return copy.directionDown;
    case 'up':
      return copy.directionUp;
    case 'steady':
      return copy.directionSteady;
    case 'insufficient':
      return copy.directionInsufficient;
  }
}

/**
 * The in-words summary that mirrors the chart (issue #26). This is the accessible
 * equivalent of the ProgressChart — a screen reader gets the same information a
 * sighted reader sees in the line — and it is useful to everyone, not only
 * assistive tech. Direction is descriptive, never a verdict.
 */
export function ProgressSummary({
  trend,
  unitSystem,
}: {
  trend: TrendSummary;
  unitSystem: UnitSystem;
}) {
  return (
    <View style={{ gap: spacing.xs }}>
      <SectionTitle>{copy.summaryTitle}</SectionTitle>
      <Body>{directionSentence(trend.direction)}</Body>
      {trend.lastKg != null ? (
        <Caption color="plum">
          {copy.currentAverageLabel}: {formatWeight(trend.lastKg, unitSystem)}
        </Caption>
      ) : null}
      <Caption color="plum">
        {copy.weeksLoggedLabel}: {trend.weeks}
      </Caption>
    </View>
  );
}

export default ProgressSummary;
