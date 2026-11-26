import { useEffect, useState } from 'react';
import { AccessibilityInfo, Animated, Platform, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { motion } from '@/design/motion';
import { colors, spacing } from '@/design/tokens';
import { useReducedMotion } from '@/design/useReducedMotion';

import { Caption } from './Typography';

/** How long the confirmation stays on screen, in ms. */
export const SAVED_CONFIRMATION_VISIBLE_MS = 2000;

export interface SavedConfirmationProps {
  /**
   * Increment after each successful save to show the confirmation again.
   * `0` (the initial value) shows nothing.
   */
  trigger: number;
  /** Short, neutral label from a content module, e.g. "Saved". */
  label: string;
  testID?: string;
}

/**
 * A calm acknowledgement that something was saved (issue #153): a small check
 * mark and a short label that fade in, rest for about two seconds, then fade
 * away by themselves. No confetti, no praise, and the same message for every
 * save. It is announced politely to screen readers (a live region on Android
 * and web, an announcement on iOS). Under reduce-motion it appears and
 * disappears with no animation. Callers show it only after a save succeeds.
 */
export function SavedConfirmation({
  trigger,
  label,
  testID,
}: SavedConfirmationProps) {
  const reduceMotion = useReducedMotion();
  // The save (trigger value) whose confirmation has already timed out.
  const [hiddenFor, setHiddenFor] = useState(0);
  const visible = trigger > 0 && hiddenFor !== trigger;
  const [opacity] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (trigger <= 0) return;

    if (Platform.OS === 'ios') {
      // iOS has no live regions; announce once instead.
      AccessibilityInfo.announceForAccessibility(label);
    }

    let fadeOut: Animated.CompositeAnimation | null = null;
    let fadeTimer: ReturnType<typeof setTimeout> | null = null;
    const fadeIn = reduceMotion
      ? null
      : Animated.timing(opacity, {
          toValue: 1,
          duration: motion.duration.gentle,
          useNativeDriver: true,
        });

    if (fadeIn) {
      opacity.setValue(0);
      fadeIn.start();
      fadeTimer = setTimeout(() => {
        fadeOut = Animated.timing(opacity, {
          toValue: 0,
          duration: motion.duration.gentle,
          useNativeDriver: true,
        });
        fadeOut.start();
      }, SAVED_CONFIRMATION_VISIBLE_MS - motion.duration.gentle);
    } else {
      opacity.setValue(1);
    }

    const hideTimer = setTimeout(
      () => setHiddenFor(trigger),
      SAVED_CONFIRMATION_VISIBLE_MS,
    );

    return () => {
      clearTimeout(hideTimer);
      if (fadeTimer) clearTimeout(fadeTimer);
      fadeIn?.stop();
      fadeOut?.stop();
    };
    // Re-run only for a new save; label and motion are read at that moment.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trigger]);

  if (!visible) return null;

  return (
    <Animated.View
      testID={testID}
      accessibilityLiveRegion="polite"
      role="status"
      style={[
        { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
        reduceMotion ? null : { opacity },
      ]}
    >
      <View accessibilityElementsHidden importantForAccessibility="no">
        <Svg width={18} height={18} viewBox="0 0 24 24">
          <Circle cx={12} cy={12} r={11} fill={colors.sage} />
          <Path
            d="M7 12.5l3.2 3.2L17 9"
            fill="none"
            stroke={colors.ivory}
            strokeWidth={2.4}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      </View>
      <Caption color="plum">{label}</Caption>
    </Animated.View>
  );
}

export default SavedConfirmation;
