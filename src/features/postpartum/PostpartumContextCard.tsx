import { View } from 'react-native';

import { Body, Caption, Card, SectionTitle } from '@/components';
import { postpartumCopy } from '@/content/postpartum';
import { colors, spacing } from '@/design/tokens';
import { useProfileStore } from '@/features/profile';

import {
  buildRecoveryContext,
  type PostpartumStatus,
  type RecoveryContext,
} from './context';
import {
  getFeedingAdjustment,
  type FeedingAdjustment,
  type FeedingContext,
} from './feedingAdjustments';

/**
 * Gentle, presentational recovery-context card (issue #35).
 *
 * Renders the NON-DIAGNOSTIC recovery note and the draft feeding adjustment for
 * the loaded profile, always with the honest draft disclaimer. It diagnoses
 * nothing, pressures no pace, and shows no target. All copy comes from
 * src/content/postpartum.ts. The pure logic in ./context and ./feedingAdjustments
 * decides what is safe to show; this component only lays it out.
 */

const POSTPARTUM_STATUSES: readonly PostpartumStatus[] = [
  'postpartum',
  'not_postpartum',
  'prefer_not_to_say',
];

const FEEDING_CONTEXTS: readonly FeedingContext[] = [
  'breastfeeding',
  'mixed',
  'formula',
  'not_feeding',
  'prefer_not_to_say',
];

/** Narrow the profile's free-form string to a known status, or null (missing). */
function asPostpartumStatus(value: string | null): PostpartumStatus | null {
  return POSTPARTUM_STATUSES.find((status) => status === value) ?? null;
}

/** Narrow the profile's free-form string to a known feeding context, or null. */
function asFeedingContext(value: string | null): FeedingContext | null {
  return FEEDING_CONTEXTS.find((context) => context === value) ?? null;
}

export interface PostpartumContextCardProps {
  /** Optional overrides, primarily for previews and tests. */
  readonly context?: RecoveryContext;
  readonly adjustment?: FeedingAdjustment;
}

export function PostpartumContextCard({
  context,
  adjustment,
}: PostpartumContextCardProps) {
  const profile = useProfileStore((state) => state.profile);

  const resolvedContext =
    context ??
    buildRecoveryContext({
      postpartumStatus: asPostpartumStatus(profile?.postpartum_status ?? null),
      postpartumMonths: profile?.postpartum_months ?? null,
    });

  const resolvedAdjustment =
    adjustment ??
    getFeedingAdjustment(asFeedingContext(profile?.feeding_context ?? null));

  const showAllowance = resolvedAdjustment.allowance.max > 0;

  return (
    <Card accessible accessibilityLabel={resolvedContext.narrative}>
      <Caption color="terracotta">{postpartumCopy.cardLabel}</Caption>
      <SectionTitle>{postpartumCopy.cardHeading}</SectionTitle>
      <Body>{resolvedContext.narrative}</Body>

      <View style={{ gap: spacing.xs, marginTop: spacing.sm }}>
        <SectionTitle>{postpartumCopy.adjustmentsHeading}</SectionTitle>
        <Body>{resolvedAdjustment.reason}</Body>
        {showAllowance ? (
          <Caption color="plum">
            {`${resolvedAdjustment.allowance.min}–${resolvedAdjustment.allowance.max} kcal`}
          </Caption>
        ) : null}
      </View>

      <View
        style={{
          marginTop: spacing.sm,
          paddingTop: spacing.sm,
          borderTopWidth: 1,
          borderTopColor: colors.mutedSage,
        }}
      >
        <Caption color="plum">{postpartumCopy.draftDisclaimer}</Caption>
      </View>
    </Card>
  );
}

export default PostpartumContextCard;
