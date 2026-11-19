import { useEffect, useState } from 'react';
import { Animated, type ViewProps } from 'react-native';

import { motion } from '@/design/motion';
import { useReducedMotion } from '@/design/useReducedMotion';

export interface FadeInProps extends ViewProps {
  /** Stagger delay in ms so sections arrive in sequence. */
  delay?: number;
  /**
   * `rise` (default) fades content up a few points into place; `settle` fades
   * it in with a very slight scale, suited to illustrations.
   */
  variant?: 'rise' | 'settle';
}

/**
 * The shared, gentle entrance (issue #51). Content fades in and rises (or
 * settles) into place once, on mount. Motion is non-essential, so it is fully
 * suppressed under the reader's reduce-motion setting: the content renders in
 * its final state with no animation started. Uses core Animated (no extra
 * native dependencies) and the native driver.
 */
export function FadeIn({
  delay = 0,
  variant = 'rise',
  style,
  children,
  ...rest
}: FadeInProps) {
  const reduceMotion = useReducedMotion();
  // Lazily created once; a stable Animated.Value for the lifetime of the view.
  const [progress] = useState(() => new Animated.Value(reduceMotion ? 1 : 0));

  useEffect(() => {
    if (reduceMotion) {
      progress.stopAnimation();
      progress.setValue(1);
      return;
    }
    const animation = Animated.timing(progress, {
      toValue: 1,
      duration: motion.duration.entrance,
      delay,
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [progress, delay, reduceMotion]);

  const transform =
    variant === 'settle'
      ? [
          {
            scale: progress.interpolate({
              inputRange: [0, 1],
              outputRange: [motion.settleFromScale, 1],
            }),
          },
        ]
      : [
          {
            translateY: progress.interpolate({
              inputRange: [0, 1],
              outputRange: [motion.riseDistance, 0],
            }),
          },
        ];

  return (
    <Animated.View
      style={[reduceMotion ? null : { opacity: progress, transform }, style]}
      {...rest}
    >
      {children}
    </Animated.View>
  );
}

export default FadeIn;
