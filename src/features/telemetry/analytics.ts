import { useAuthStore } from '@/features/auth';
import { getSupabaseClient, type AppSupabaseClient } from '@/lib/supabase';

/**
 * Allowlisted product analytics (issue #53).
 *
 * Fixed schema by construction: an event is ONLY a name from this allowlist plus
 * the signed-in user's id. `track` takes no properties argument, so weights,
 * meals, free text, emails, or locations cannot be attached. The server enforces
 * the same allowlist (analytics_event_types foreign key) and own-user-only
 * inserts, and events are never readable by clients. Analytics are first-party
 * only (no third-party SDK), never sent while signed out, and never throw.
 */

/** Mirrors the server allowlist in analytics_event_types. */
export const ANALYTICS_EVENTS = [
  'onboarding_started',
  'onboarding_completed',
  'weight_logged',
  'meal_viewed',
  'community_post_created',
] as const;

export type AnalyticsEvent = (typeof ANALYTICS_EVENTS)[number];

export function isAnalyticsEvent(value: unknown): value is AnalyticsEvent {
  return (
    typeof value === 'string' &&
    (ANALYTICS_EVENTS as readonly string[]).includes(value)
  );
}

/**
 * Record an allowlisted event for the signed-in user. Resolves true if recorded,
 * false if skipped (unknown event, signed out) or failed. Never throws.
 */
export async function track(
  event: AnalyticsEvent,
  client?: AppSupabaseClient,
): Promise<boolean> {
  try {
    if (!isAnalyticsEvent(event)) return false;
    const userId = useAuthStore.getState().session?.user.id;
    if (!userId) return false;
    const { error } = await (client ?? getSupabaseClient())
      .from('analytics_events')
      .insert({ event_name: event, user_id: userId });
    return !error;
  } catch {
    return false;
  }
}
