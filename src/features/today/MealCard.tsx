import { useEffect, useState } from 'react';
import {
  Animated,
  LayoutAnimation,
  Platform,
  Pressable,
  UIManager,
  View,
} from 'react-native';

import { Body, Button, Caption, SectionTitle } from '@/components';
import { todayCopy as copy } from '@/content/today';
import { motion } from '@/design/motion';
import { colors, radii, spacing } from '@/design/tokens';
import { useReducedMotion } from '@/design/useReducedMotion';
import { track } from '@/features/telemetry';

import type { MockMeal } from './mockMeals';

// LayoutAnimation needs this opt-in on old-architecture Android; harmless
// elsewhere and on Fabric. Guarded so it never throws under tests.
if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

function Chevron({ expanded }: { expanded: boolean }) {
  const reduceMotion = useReducedMotion();
  // Lazily created once; a stable Animated.Value for the chevron rotation.
  const [turn] = useState(() => new Animated.Value(expanded ? 1 : 0));

  useEffect(() => {
    if (reduceMotion) {
      turn.setValue(expanded ? 1 : 0);
      return;
    }
    const animation = Animated.timing(turn, {
      toValue: expanded ? 1 : 0,
      duration: motion.duration.quick,
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [expanded, reduceMotion, turn]);

  const rotate = turn.interpolate({
    inputRange: [0, 1],
    outputRange: ['45deg', '-135deg'], // caret points down, then up
  });

  return (
    <Animated.View
      accessible={false}
      style={{
        width: 10,
        height: 10,
        marginTop: 6,
        borderColor: colors.plum,
        borderRightWidth: 2,
        borderBottomWidth: 2,
        transform: [{ rotate }],
      }}
    />
  );
}

function Tag({ label }: { label: string }) {
  return (
    <View
      style={{
        borderWidth: 1,
        borderColor: colors.mutedSage,
        borderRadius: radii.pill,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
      }}
    >
      <Caption color="sage">{label}</Caption>
    </View>
  );
}

/**
 * A meal idea as a tappable, expandable card (issue #22). The dish name leads;
 * calories appear only as a small, secondary approximate range. Tapping the card
 * reveals its ingredients and a quick "note this meal" action, with a gentle
 * height animation and press feedback — both suppressed under reduce-motion.
 * Illustrative mock content only; real recommendations are a later phase.
 */
export function MealCard({
  meal,
  onLog,
}: {
  meal: MockMeal;
  onLog: () => void;
}) {
  const reduceMotion = useReducedMotion();
  const [expanded, setExpanded] = useState(false);

  const toggle = () => {
    if (!reduceMotion) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    }
    // Allowlisted analytics (#53): a meal counts as viewed when it is opened,
    // not when it is closed. Name only — never which meal.
    if (!expanded) void track('meal_viewed');
    setExpanded((value) => !value);
  };

  return (
    <View
      style={{
        backgroundColor: colors.ivory,
        borderRadius: radii.card,
        borderWidth: 1,
        borderColor: expanded ? colors.mutedSage : colors.blush,
        overflow: 'hidden',
      }}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={meal.name}
        accessibilityHint={copy.mealExpandHint}
        accessibilityState={{ expanded }}
        onPress={toggle}
      >
        {/* Visual on a plain View, not the style function, and never
            transform: undefined (#146). */}
        {({ pressed }) => (
          <View
            style={{
              padding: spacing.lg,
              gap: spacing.sm,
              transform: [{ scale: pressed && !reduceMotion ? 0.985 : 1 }],
            }}
          >
            <View style={{ flexDirection: 'row', gap: spacing.md }}>
              <View style={{ flex: 1 }}>
                <SectionTitle>{meal.name}</SectionTitle>
              </View>
              <Chevron expanded={expanded} />
            </View>

            {meal.tags.length > 0 ? (
              <View
                style={{
                  flexDirection: 'row',
                  flexWrap: 'wrap',
                  gap: spacing.xs,
                }}
              >
                {meal.tags.map((tag) => (
                  <Tag key={tag} label={tag} />
                ))}
              </View>
            ) : null}

            {/* Calories stay small, muted, and clearly approximate. */}
            <Caption color="gold">
              {copy.mealCaloriesLabel} {meal.calories.min}–{meal.calories.max}{' '}
              {copy.mealCaloriesUnit}
            </Caption>
          </View>
        )}
      </Pressable>

      {expanded ? (
        <View
          style={{
            paddingHorizontal: spacing.lg,
            paddingBottom: spacing.lg,
            gap: spacing.md,
          }}
        >
          <Body color="plum" style={{ opacity: 0.85 }}>
            {meal.ingredients}
          </Body>
          <Button label={copy.mealLog} variant="ghost" onPress={onLog} />
        </View>
      ) : null}
    </View>
  );
}

export default MealCard;
