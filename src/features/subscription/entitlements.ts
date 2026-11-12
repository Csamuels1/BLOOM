/**
 * Entitlement model (issue #23) — presentation only for now.
 *
 * BLOOM has two tiers. The real entitlement source (RevenueCat + the
 * `subscriptions` table) is wired in Phase 10; until then every caller is
 * treated as Free. Keeping this in one place means the Home screen can already
 * show Free allowances and Pro affordances clearly, and Phase 10 only has to
 * change where the tier comes from.
 */

export type Tier = 'free' | 'pro';

/** How many daily meal ideas the Free plan shows. */
export const FREE_DAILY_MEAL_IDEAS = 3;

/**
 * The caller's current tier. Placeholder: always Free until Phase 10 connects
 * the real entitlement source. Authorization is never decided from this value
 * on the client — server-side checks gate Pro features in later phases.
 */
export function useTier(): Tier {
  return 'free';
}
