import { useReducedMotion } from './useReducedMotion';

/**
 * Screen transitions (issue #149).
 *
 * - `push`: a screen opened over another (weight log, support, paywall…) uses
 *   the platform's native transition, so Android back and iOS swipe-back feel
 *   familiar.
 * - `switch`: changing between whole areas (signed out → signed in) and
 *   between tabs is a short cross-fade, calmer than a slide.
 *
 * Reduce Motion turns every transition off (docs/BRAND_AND_COPY.md).
 */
export type ScreenTransitionKind = 'push' | 'switch';

export function screenAnimation(
  kind: ScreenTransitionKind,
  reduceMotion: boolean,
): 'none' | 'fade' | 'default' {
  if (reduceMotion) return 'none';
  return kind === 'switch' ? 'fade' : 'default';
}

export function useScreenAnimation(kind: ScreenTransitionKind) {
  return screenAnimation(kind, useReducedMotion());
}
