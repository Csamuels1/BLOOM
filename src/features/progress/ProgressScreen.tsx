import { router } from 'expo-router';
import { useEffect, useMemo } from 'react';
import { View } from 'react-native';

import {
  Body,
  Caption,
  EmptyState,
  ErrorState,
  PageTitle,
  SectionTitle,
  Skeleton,
} from '@/components';
import { milestoneLabel, progressCopy as copy } from '@/content/progress';
import { colors, radii, spacing } from '@/design/tokens';
import { useProfileStore } from '@/features/profile';
import { useWeightStore, type UnitSystem } from '@/features/weight';
import { getSupabaseClient, type AppSupabaseClient } from '@/lib/supabase';

import { ProgressChart } from './ProgressChart';
import { ProgressSummary } from './ProgressSummary';
import { earnedMilestones } from './milestones';
import { summarizeTrend, toWeeklyAverages } from './weeklyAverages';

export interface ProgressScreenProps {
  /** Injectable for tests; defaults to the shared client. */
  client?: AppSupabaseClient;
}

/**
 * The progress view (issue #26): a weekly-average trend chart with a matching
 * in-words summary and gentle milestones, over the caller's weight entries. It
 * emphasizes weekly averages (daily spikes are never plotted), keeps the summary
 * and chart in sync for accessibility, and celebrates showing up — never a
 * streak or a number. Loading / empty / error states are gentle and retryable.
 */
export function ProgressScreen({ client }: ProgressScreenProps) {
  const entries = useWeightStore((state) => state.entries);
  const status = useWeightStore((state) => state.status);
  const load = useWeightStore((state) => state.load);
  const unitSystem: UnitSystem = useProfileStore((state) =>
    state.profile?.unit_system === 'imperial' ? 'imperial' : 'metric',
  );

  const resolveClient = (): AppSupabaseClient => client ?? getSupabaseClient();

  useEffect(() => {
    if (status === 'idle') {
      void load(resolveClient());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const points = useMemo(() => toWeeklyAverages(entries), [entries]);
  const trend = useMemo(() => summarizeTrend(points), [points]);
  const milestones = useMemo(() => earnedMilestones(entries), [entries]);

  const isLoading = status === 'idle' || status === 'loading';
  const isError = status === 'error';
  const isEmpty = status === 'loaded' && entries.length === 0;

  return (
    <View style={{ gap: spacing.xl }}>
      <View style={{ gap: spacing.xs }}>
        <PageTitle>{copy.title}</PageTitle>
        <Body>{copy.intro}</Body>
      </View>

      {isLoading ? (
        <View
          accessibilityRole="progressbar"
          accessibilityLabel={copy.loadingLabel}
          style={{ gap: spacing.sm }}
        >
          <Skeleton width="100%" height={140} radius={radii.card} />
          <Skeleton width="60%" height={16} />
          <Skeleton width="40%" height={16} />
        </View>
      ) : null}

      {isError ? (
        <ErrorState
          title={copy.errorTitle}
          message={copy.errorBody}
          retryLabel={copy.retry}
          onRetry={() => void load(resolveClient())}
        />
      ) : null}

      {isEmpty ? (
        <EmptyState
          title={copy.emptyTitle}
          body={copy.emptyBody}
          actionLabel={copy.emptyCta}
          onAction={() => router.navigate('/weight-log')}
        />
      ) : null}

      {!isLoading && !isError && !isEmpty ? (
        <>
          <View style={{ gap: spacing.sm }}>
            <SectionTitle>{copy.chartTitle}</SectionTitle>
            <ProgressChart points={points} />
            <Caption color="plum">{copy.chartNote}</Caption>
          </View>

          <ProgressSummary trend={trend} unitSystem={unitSystem} />

          {milestones.length > 0 ? (
            <View style={{ gap: spacing.sm }}>
              <SectionTitle>{copy.milestonesTitle}</SectionTitle>
              <View
                style={{
                  backgroundColor: colors.ivory,
                  borderRadius: radii.card,
                  borderWidth: 1,
                  borderColor: colors.mutedSage,
                  padding: spacing.lg,
                  gap: spacing.sm,
                }}
              >
                {milestones.map((milestone) => (
                  <Body key={milestone.id}>
                    • {milestoneLabel(milestone.id)}
                  </Body>
                ))}
              </View>
            </View>
          ) : null}
        </>
      ) : null}
    </View>
  );
}

export default ProgressScreen;
