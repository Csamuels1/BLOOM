import type { AppSupabaseClient } from '@/lib/supabase';
import type { Database } from '@/types/database';

/**
 * Regional support resources (issue #49).
 *
 * The server only ever exposes active, verified resources (resources_select_active,
 * #19) that carry a review date (support_resources_active_requires_review), so
 * anything returned here is reviewed and dated. This module fetches the caller's
 * region plus global, orders crisis help first, and maps rows for display. It
 * never fabricates a resource; when none are verified yet, the Support screen's
 * always-present fallback is what keeps "talk to someone" reachable.
 */

type Row = Database['public']['Tables']['support_resources']['Row'];

export type ResourceRegion = 'nigeria' | 'united_states' | 'global';
export type ResourceCategory =
  'crisis' | 'mental_health' | 'dietitian' | 'postpartum' | 'general';

export interface SupportResource {
  id: string;
  region: string;
  category: string;
  name: string;
  description: string | null;
  contactPhone: string | null;
  contactUrl: string | null;
  reviewedAt: string | null;
}

/** Map a profile country code to a resource region; unknown falls back to global. */
export function resourceRegionForCountry(
  countryCode?: string | null,
): ResourceRegion {
  const code = countryCode?.toUpperCase();
  if (code === 'NG') return 'nigeria';
  if (code === 'US') return 'united_states';
  return 'global';
}

// Crisis help always comes first; the rest follow in a calm, stable order.
const CATEGORY_ORDER: Record<string, number> = {
  crisis: 0,
  mental_health: 1,
  postpartum: 2,
  dietitian: 3,
  general: 4,
};

const COLUMNS =
  'id, region, category, name, description, contact_phone, contact_url, reviewed_at';

/**
 * Fetch reviewed resources for a region (plus global). Returns null on error so
 * the screen keeps its fallback rather than implying there is nothing.
 */
export async function fetchResources(
  client: AppSupabaseClient,
  region: ResourceRegion,
): Promise<SupportResource[] | null> {
  const regions = region === 'global' ? ['global'] : [region, 'global'];
  let data: unknown;
  try {
    const result = await client
      .from('support_resources')
      .select(COLUMNS)
      .in('region', regions);
    if (result.error) return null;
    data = result.data;
  } catch {
    // Offline / transport failure: keep the screen's fallback, never throw.
    return null;
  }

  if (!data) return null;

  const rows = data as Pick<
    Row,
    | 'id'
    | 'region'
    | 'category'
    | 'name'
    | 'description'
    | 'contact_phone'
    | 'contact_url'
    | 'reviewed_at'
  >[];

  return rows
    .map((r) => ({
      id: r.id,
      region: r.region,
      category: r.category,
      name: r.name,
      description: r.description,
      contactPhone: r.contact_phone,
      contactUrl: r.contact_url,
      reviewedAt: r.reviewed_at,
    }))
    .sort((a, b) => {
      const byCat =
        (CATEGORY_ORDER[a.category] ?? 99) - (CATEGORY_ORDER[b.category] ?? 99);
      if (byCat !== 0) return byCat;
      // Newer review first within a category.
      return (b.reviewedAt ?? '').localeCompare(a.reviewedAt ?? '');
    });
}
