import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

/**
 * The last reduce-motion value read from the OS, shared across hook instances.
 * Views mounted after the first read start from the known value, so a reader
 * who opted out of motion never sees even the first frame of an entrance.
 */
let lastKnownReduceMotion = false;

/** Test-only: reset the shared snapshot between tests. */
export function resetReducedMotionSnapshot(): void {
  lastKnownReduceMotion = false;
}

/**
 * Tracks the OS "reduce motion" accessibility setting.
 *
 * Components use this to drop non-essential motion (press scaling, transitions)
 * for readers who opt out, per docs/BRAND_AND_COPY.md ("Respect reduced-motion
 * settings"). Starts from the last value read this session (false before the
 * first read resolves), then follows the OS setting live.
 */
export function useReducedMotion(): boolean {
  const [reduceMotion, setReduceMotion] = useState(lastKnownReduceMotion);

  useEffect(() => {
    let mounted = true;

    const apply = (enabled: boolean) => {
      lastKnownReduceMotion = enabled;
      if (mounted) setReduceMotion(enabled);
    };

    AccessibilityInfo.isReduceMotionEnabled()
      .then(apply)
      .catch(() => {
        // Treat an unavailable API as "motion allowed"; never crash on it.
      });

    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      apply,
    );

    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);

  return reduceMotion;
}

export default useReducedMotion;
