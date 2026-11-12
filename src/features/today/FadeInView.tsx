import { useEffect, useState } from 'react';
import { Animated, type ViewProps } from 'react-native';

import { useReducedMotion } from '@/design/useReducedMotion';

interface FadeInViewProps extends ViewProps {
  /** Stagger delay in ms so sections arrive in sequence. */
  delay?: number;
}

/**
 * A gentle entrance: content fades and rises a few points into place on mount.
 * Motion is non-essential, so it is fully suppressed under the reader's
 * reduce-motion setting (docs/BRAND_AND_COPY.md) — the content simply renders in
 * its final position. Uses core Animated (no extra native deps).
 */
export function FadeInView({
  delay = 0,
  style,
  children,
  ...rest
}: FadeInViewProps) {
  const reduceMotion = useReducedMotion();
  // Lazily created once; a stable Animated.Value for the lifetime of the view.
  const [progress] = useState(() => new Animated.Value(reduceMotion ? 1 : 0));

  useEffect(() => {
    if (reduceMotion) {
      progress.setValue(1);
      return;
    }
    const animation = Animated.timing(progress, {
      toValue: 1,
      duration: 460,
      delay,
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [progress, delay, reduceMotion]);

  return (
    <Animated.View
      style={[
        {
          opacity: progress,
          transform: [
            {
              translateY: progress.interpolate({
                inputRange: [0, 1],
                outputRange: [10, 0],
              }),
            },
          ],
        },
        style,
      ]}
      {...rest}
    >
      {children}
    </Animated.View>
  );
}

export default FadeInView;
