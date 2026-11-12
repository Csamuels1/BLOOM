import { useEffect, useState } from 'react';
import { Animated, type DimensionValue, type ViewStyle } from 'react-native';

import { colors, radii } from '@/design/tokens';
import { useReducedMotion } from '@/design/useReducedMotion';

export interface SkeletonProps {
  /** Width of the placeholder bar. Defaults to full width. */
  width?: DimensionValue;
  height?: number;
  radius?: number;
  style?: ViewStyle;
}

/**
 * A calm loading placeholder. Pulses softly to signal "loading" without a
 * spinner's urgency; the pulse is suppressed under reduce-motion. Hidden from
 * assistive tech — the surrounding region announces the loading state instead.
 */
export function Skeleton({
  width = '100%',
  height = 16,
  radius = radii.button,
  style,
}: SkeletonProps) {
  const reduceMotion = useReducedMotion();
  const [pulse] = useState(() => new Animated.Value(0.5));

  useEffect(() => {
    if (reduceMotion) {
      pulse.setValue(0.6);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 650,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0.5,
          duration: 650,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse, reduceMotion]);

  return (
    <Animated.View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
        {
          width,
          height,
          borderRadius: radius,
          backgroundColor: colors.mutedSage,
          opacity: pulse,
        },
        style,
      ]}
    />
  );
}

export default Skeleton;
