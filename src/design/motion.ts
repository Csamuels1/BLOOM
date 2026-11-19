/**
 * BLOOM motion tokens (issue #51). One small, consistent vocabulary so every
 * animated surface feels the same: short, soft, and never insistent.
 *
 * Rules (docs/BRAND_AND_COPY.md "Interaction personality"):
 * - Motion is always non-essential. Under the OS reduce-motion setting every
 *   animation is skipped and the final state renders instantly — callers check
 *   `useReducedMotion()` (or use `FadeIn`, which already does).
 * - No flashing, bouncing, looping celebration, confetti, or countdowns. The
 *   only loop allowed is the calm skeleton pulse, which also stops under
 *   reduce-motion.
 * - Keep durations short so motion never delays someone who is in a hurry.
 */
export const motion = {
  duration: {
    /** Press feedback, chevrons, toggles. */
    quick: 180,
    /** Expanding cards and state changes. */
    gentle: 280,
    /** Content entrances (fade + small rise). */
    entrance: 420,
    /** One half of the skeleton pulse. */
    pulse: 650,
  },
  /** Delay between staggered sections, kept small so content never waits long. */
  stagger: 70,
  /** Distance (dp) content rises during an entrance. */
  riseDistance: 8,
  /** Press scale for tappable surfaces; subtle on purpose. */
  pressScale: 0.98,
  /** Starting scale for a soft "settle" entrance (e.g. illustrations). */
  settleFromScale: 0.96,
} as const;

/** Upper bound for any single animation, enforced by tests. */
export const MAX_MOTION_DURATION_MS = 700;

export type MotionDuration = keyof typeof motion.duration;
