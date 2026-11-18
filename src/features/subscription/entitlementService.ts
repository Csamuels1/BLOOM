import type { AppSupabaseClient } from '@/lib/supabase';
import type { Database } from '@/types/database';

/**
 * Entitlement read (issue #45).
 *
 * The server is the authority on Pro access. This reads the caller's OWN
 * subscription row, which RLS scopes to them (select-own, #19) and which only
 * the RevenueCat webhook can write (#44). The value is advisory — it decides
 * what the UI shows, never whether a premium action succeeds; every premium
 * action is enforced at the server/data boundary (e.g. is_pro() on community
 * posting, #119). On any error the caller falls back to Free (least privilege).
 */

type SubscriptionRow = Database['public']['Tables']['subscriptions']['Row'];

/** Statuses that still grant Pro access (mirrors public.is_pro()). */
const PRO_STATUSES: ReadonlySet<string> = new Set(['active', 'in_grace']);

export interface Entitlement {
  tier: 'free' | 'pro';
  status: string;
  isPro: boolean;
  currentPeriodEnd: string | null;
}

/** Free entitlement — the safe default when there is no row or a read fails. */
export const FREE_ENTITLEMENT: Entitlement = {
  tier: 'free',
  status: 'active',
  isPro: false,
  currentPeriodEnd: null,
};

function toEntitlement(
  row: Pick<SubscriptionRow, 'tier' | 'status' | 'current_period_end'> | null,
): Entitlement {
  if (!row) return FREE_ENTITLEMENT;
  const isPro = row.tier === 'pro' && PRO_STATUSES.has(row.status);
  return {
    tier: row.tier === 'pro' ? 'pro' : 'free',
    status: row.status,
    isPro,
    currentPeriodEnd: row.current_period_end,
  };
}

/**
 * Fetch the caller's entitlement from the server. Returns the entitlement, or
 * `null` when the read fails (the store keeps that distinct from a confirmed
 * Free so it can fall back deliberately rather than cache a wrong value).
 */
export async function fetchEntitlement(
  client: AppSupabaseClient,
): Promise<Entitlement | null> {
  const { data, error } = await client
    .from('subscriptions')
    .select('tier, status, current_period_end')
    .maybeSingle();

  if (error) return null;
  return toEntitlement(data);
}
