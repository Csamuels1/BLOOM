/**
 * Entitlement model (issues #23, #45).
 *
 * BLOOM has two tiers. The real source is the server: the caller's own
 * `subscriptions` row (RLS-scoped, written only by the RevenueCat webhook, #44),
 * cached client-side with a TTL and keyed to the signed-in user (#45). The hooks
 * below read that cache for UI only — authorization for every premium action is
 * enforced server-side (e.g. is_pro() on community posting, #119); hidden UI is
 * never authorization.
 */

import { useAuthStore } from '@/features/auth';

import { selectIsPro, useSubscriptionStore } from './subscriptionStore';

export type Tier = 'free' | 'pro';

/** How many daily meal ideas the Free plan shows. */
export const FREE_DAILY_MEAL_IDEAS = 3;

/**
 * Whether the signed-in user currently has Pro, from the cached entitlement.
 * Returns false unless the cache belongs to this same user and is still fresh,
 * so a stale cache or a just-switched account fails safe to Free.
 */
export function useIsPro(): boolean {
  const userId = useAuthStore((state) => state.session?.user.id);
  return useSubscriptionStore((state) => selectIsPro(state, userId));
}

/** The caller's current tier for UI. Server checks still gate real access. */
export function useTier(): Tier {
  return useIsPro() ? 'pro' : 'free';
}
