import { useAuthStore } from '@/features/auth';
import type { AppSupabaseClient } from '@/lib/supabase';
import {
  ANALYTICS_EVENTS,
  track,
  type AnalyticsEvent,
} from '@/features/telemetry';

function clientWith(insert: jest.Mock) {
  const from = jest.fn(() => ({ insert }));
  return { client: { from } as unknown as AppSupabaseClient, from };
}

beforeEach(() => {
  useAuthStore.setState({ session: { user: { id: 'u1' } } } as never);
});

describe('track', () => {
  it('records exactly { event_name, user_id } and nothing else', async () => {
    const insert = jest.fn(async () => ({ error: null }));
    const { client, from } = clientWith(insert);
    expect(await track('weight_logged', client)).toBe(true);
    expect(from).toHaveBeenCalledWith('analytics_events');
    expect(insert).toHaveBeenCalledWith({
      event_name: 'weight_logged',
      user_id: 'u1',
    });
  });

  it('refuses events outside the allowlist without sending anything', async () => {
    const insert = jest.fn();
    const { client } = clientWith(insert);
    expect(await track('weight_was_75kg' as AnalyticsEvent, client)).toBe(
      false,
    );
    expect(insert).not.toHaveBeenCalled();
  });

  it('sends nothing while signed out', async () => {
    useAuthStore.setState({ session: null } as never);
    const insert = jest.fn();
    const { client } = clientWith(insert);
    expect(await track('meal_viewed', client)).toBe(false);
    expect(insert).not.toHaveBeenCalled();
  });

  it('never throws on failure', async () => {
    const insert = jest.fn(async () => {
      throw new Error('offline');
    });
    const { client } = clientWith(insert);
    await expect(track('meal_viewed', client)).resolves.toBe(false);
  });

  it('exposes a closed allowlist', () => {
    expect(ANALYTICS_EVENTS).toEqual([
      'onboarding_started',
      'onboarding_completed',
      'weight_logged',
      'meal_viewed',
      'community_post_created',
    ]);
  });
});
