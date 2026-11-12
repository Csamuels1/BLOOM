import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { View } from 'react-native';

import {
  Body,
  Button,
  Caption,
  EmptyState,
  ErrorState,
  PageTitle,
  SectionTitle,
} from '@/components';
import { subscriptionCopy } from '@/content/subscription';
import { todayCopy as copy } from '@/content/today';
import { colors, radii, spacing } from '@/design/tokens';
import { hasCompletedOnboarding, useProfileStore } from '@/features/profile';
import { ProAffordance } from '@/features/subscription';

import { FadeInView } from './FadeInView';
import { MealCard } from './MealCard';
import { MealCardSkeleton } from './MealCardSkeleton';
import { mockMealsForRegion, regionForCountry } from './mockMeals';

/** Friendly local date, e.g. "Tuesday, 11 November". Locale-aware, no timezone math. */
function todayLabel(): string {
  try {
    return new Intl.DateTimeFormat(undefined, {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    }).format(new Date());
  } catch {
    return '';
  }
}

/**
 * An honest empty-state for the weekly trend: a calm dashed baseline waiting for
 * data, with a single soft "today" marker. It deliberately plots no history —
 * there is none yet — so it never implies a fabricated trend.
 */
function TrendBaseline() {
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{
        height: 44,
        justifyContent: 'center',
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
      }}
    >
      {Array.from({ length: 14 }).map((_, index) => (
        <View
          key={index}
          style={{
            flex: 1,
            height: 2,
            borderRadius: 1,
            backgroundColor: colors.mutedSage,
            opacity: 0.6,
          }}
        />
      ))}
      <View
        style={{
          width: 10,
          height: 10,
          borderRadius: 5,
          backgroundColor: colors.sage,
          marginLeft: spacing.xs,
        }}
      />
    </View>
  );
}

export interface TodayScreenProps {
  /** Re-run the profile load; shown as "try again" in the error state. */
  onRetryProfile?: () => void;
}

/**
 * The Today screen (issues #22, #23): a branded daily overview, resilient and
 * clear. It leads with warmth and context — the "bigger picture" card keeps
 * day-to-day weight changes out of the spotlight — offers an honest quick-log
 * entry point, and surfaces region-aware meal ideas. The meals area reflects the
 * profile load: skeletons while loading, a gentle setup nudge when onboarding is
 * unfinished, and a calm retryable error when the load fails — and in every case
 * the mock ideas still render (general fallback) so nothing is lost. Free
 * allowances and a pressure-free Pro affordance are shown explicitly. All motion
 * is reduce-motion-aware. No backend writes here.
 */
export function TodayScreen({ onRetryProfile }: TodayScreenProps) {
  const profile = useProfileStore((state) => state.profile);
  const status = useProfileStore((state) => state.status);
  const region = regionForCountry(profile?.country_code);
  const meals = useMemo(() => mockMealsForRegion(region), [region]);
  const dateLabel = useMemo(() => todayLabel(), []);

  // Honest placeholder: logging opens next phase. One shared, polite message.
  const [showLogNote, setShowLogNote] = useState(false);
  const noteLogging = () => setShowLogNote(true);

  const isLoading = status === 'idle' || status === 'loading';
  const isError = status === 'error';
  const needsSetup = status === 'loaded' && !hasCompletedOnboarding(profile);

  return (
    <View style={{ gap: spacing.xl }}>
      <FadeInView delay={0} style={{ gap: spacing.xs }}>
        <PageTitle>{copy.title}</PageTitle>
        {dateLabel ? <Caption color="plum">{dateLabel}</Caption> : null}
        <Body>{copy.intro}</Body>
      </FadeInView>

      {/* Trend context — gentle, weeks not days. */}
      <FadeInView delay={90}>
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
          <SectionTitle>{copy.trendTitle}</SectionTitle>
          <TrendBaseline />
          <Body>{copy.trendBody}</Body>
          <Caption color="sage">{copy.trendPending}</Caption>
        </View>
      </FadeInView>

      {/* Quick log — present and accessible, honest about availability. */}
      <FadeInView delay={170} style={{ gap: spacing.sm }}>
        <SectionTitle>{copy.quickLogTitle}</SectionTitle>
        <View
          style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}
        >
          <View style={{ flexGrow: 1, flexBasis: 140 }}>
            <Button
              label={copy.quickLogWeight}
              variant="secondary"
              onPress={() => router.navigate('/weight-log')}
            />
          </View>
          <View style={{ flexGrow: 1, flexBasis: 140 }}>
            <Button
              label={copy.quickLogMeal}
              variant="secondary"
              onPress={noteLogging}
            />
          </View>
        </View>
        {showLogNote ? (
          <View
            style={{
              backgroundColor: colors.mutedSage,
              borderRadius: radii.card,
              padding: spacing.md,
            }}
          >
            <Caption accessibilityLiveRegion="polite" role="status">
              {copy.quickLogComingSoon}
            </Caption>
          </View>
        ) : null}
      </FadeInView>

      {/* Meal ideas — region-aware, calories secondary, never rules. The meals
          always render; the state notices sit above them so nothing is lost. */}
      <FadeInView delay={250} style={{ gap: spacing.md }}>
        <SectionTitle>{copy.mealsTitle}</SectionTitle>
        <Body>{copy.mealsIntro}</Body>
        <Caption color="plum">
          {subscriptionCopy.freePlanLabel} · {subscriptionCopy.freeDailyIdeas}
        </Caption>

        {isError ? (
          <ErrorState
            title={copy.errorTitle}
            message={copy.errorBody}
            retryLabel={onRetryProfile ? copy.errorRetry : undefined}
            onRetry={onRetryProfile}
          />
        ) : null}

        {needsSetup ? (
          <EmptyState
            title={copy.setupTitle}
            body={copy.setupBody}
            actionLabel={copy.setupCta}
            onAction={() => router.navigate('/onboarding')}
          />
        ) : null}

        <View
          style={{ gap: spacing.md }}
          accessibilityLabel={isLoading ? copy.loadingLabel : undefined}
          accessibilityRole={isLoading ? 'progressbar' : undefined}
        >
          {isLoading
            ? [0, 1, 2].map((key) => <MealCardSkeleton key={key} />)
            : meals.map((meal) => (
                <MealCard key={meal.id} meal={meal} onLog={noteLogging} />
              ))}
        </View>

        <Caption color="plum" style={{ opacity: 0.8 }}>
          {copy.mealsDisclaimer}
        </Caption>
      </FadeInView>

      {/* Free allowances are clear; Pro is an open door, never a locked gate. */}
      <FadeInView delay={330}>
        <ProAffordance />
      </FadeInView>
    </View>
  );
}

export default TodayScreen;
