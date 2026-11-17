import { View } from 'react-native';

import { Body, Caption, Card, SectionTitle } from '@/components';
import { cycleCopy as copy } from '@/content/cycle';
import { spacing } from '@/design/tokens';

import type { CycleInsight, CyclePhase } from './insights';

export interface CycleInsightCardProps {
  insight: CycleInsight;
}

/** Soft, non-diagnostic label + description for an estimated phase. */
function phaseCopy(phase: CyclePhase): { label: string; body: string } {
  switch (phase) {
    case 'menstrual':
      return { label: copy.phaseMenstrualLabel, body: copy.phaseMenstrualBody };
    case 'follicular':
      return {
        label: copy.phaseFollicularLabel,
        body: copy.phaseFollicularBody,
      };
    case 'ovulatory':
      return { label: copy.phaseOvulatoryLabel, body: copy.phaseOvulatoryBody };
    case 'luteal':
      return { label: copy.phaseLutealLabel, body: copy.phaseLutealBody };
    case 'uncertain':
    default:
      return {
        label: copy.phaseUncertainLabel,
        body: copy.phaseUncertainBody,
      };
  }
}

/**
 * Renders the cycle insight as a calm, explicitly uncertain estimate (issue
 * #34). Never a diagnosis and never a prediction: with too little data it says
 * so, and every estimate carries its confidence and a plain disclaimer.
 */
export function CycleInsightCard({ insight }: CycleInsightCardProps) {
  if (insight.kind === 'insufficient-data') {
    return (
      <Card>
        <View style={{ gap: spacing.sm }}>
          <SectionTitle>{copy.insufficientTitle}</SectionTitle>
          <Body>{copy.insufficientBody}</Body>
        </View>
      </Card>
    );
  }

  const phase = phaseCopy(insight.estimatedPhase);
  const confidenceNote =
    insight.confidence === 'moderate'
      ? copy.confidenceModerate
      : copy.confidenceLow;

  return (
    <Card>
      <View style={{ gap: spacing.sm }}>
        <SectionTitle>{copy.insightTitle}</SectionTitle>

        <View style={{ gap: spacing.xs }}>
          <Caption color="plum">{phase.label}</Caption>
          <Body>{phase.body}</Body>
          {insight.estimatedCycleDay !== null ? (
            <Caption color="plum">
              {copy.cycleDayValue(insight.estimatedCycleDay)}
            </Caption>
          ) : null}
        </View>

        <View style={{ gap: spacing.xs }}>
          <Caption color="plum">{copy.averageLengthLabel}</Caption>
          <Body>{copy.averageLengthValue(insight.averageCycleLength)}</Body>
        </View>

        <Caption color="plum">{confidenceNote}</Caption>
        <Caption color="plum">{copy.insightDisclaimer}</Caption>
      </View>
    </Card>
  );
}

export default CycleInsightCard;
