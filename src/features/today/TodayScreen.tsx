import { useMemo, useState } from 'react';
import { View } from 'react-native';

import { Body, Button, Caption, PageTitle, SectionTitle } from '@/components';
import { todayCopy as copy } from '@/content/today';
import { colors, radii, spacing } from '@/design/tokens';
import { useProfileStore } from '@/features/profile';

import { FadeInView } from './FadeInView';
import { MealCard } from './MealCard';
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

/**
 * The Today screen (issue #22): a branded daily overview shown before real
 * recommendations exist. It leads with warmth and context — the "bigger picture"
 * card keeps day-to-day weight changes out of the spotlight — offers a quick-log
 * entry point (logging itself arrives in Phase 6, so we say so honestly rather
 * than fake a result), and surfaces three illustrative, region-aware meal ideas
 * with calories shown only as small secondary context. Entrance and expand
 * motion is gentle and reduce-motion-aware. No backend writes here.
 */
export function TodayScreen() {
  const profile = useProfileStore((state) => state.profile);
  const region = regionForCountry(profile?.country_code);
  const meals = useMemo(() => mockMealsForRegion(region), [region]);
  const dateLabel = useMemo(() => todayLabel(), []);

  // Honest placeholder: logging opens next phase. One shared, polite message.
  const [showLogNote, setShowLogNote] = useState(false);
  const noteLogging = () => setShowLogNote(true);

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
              onPress={noteLogging}
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

      {/* Meal ideas — region-aware, calories secondary, never rules. */}
      <FadeInView delay={250} style={{ gap: spacing.md }}>
        <SectionTitle>{copy.mealsTitle}</SectionTitle>
        <Body>{copy.mealsIntro}</Body>
        <View style={{ gap: spacing.md }}>
          {meals.map((meal) => (
            <MealCard key={meal.id} meal={meal} onLog={noteLogging} />
          ))}
        </View>
        <Caption color="plum" style={{ opacity: 0.8 }}>
          {copy.mealsDisclaimer}
        </Caption>
      </FadeInView>
    </View>
  );
}

export default TodayScreen;
