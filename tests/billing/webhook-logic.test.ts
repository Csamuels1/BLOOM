import {
  isAuthorized,
  parseWebhook,
} from '../../supabase/functions/revenuecat-webhook/logic';

const USER = '11111111-2222-3333-4444-555555555555';

function event(overrides: Record<string, unknown> = {}) {
  return {
    event: {
      id: 'evt_1',
      type: 'INITIAL_PURCHASE',
      app_user_id: USER,
      event_timestamp_ms: 1_700_000_000_000,
      expiration_at_ms: 1_700_600_000_000,
      store: 'APP_STORE',
      environment: 'PRODUCTION',
      ...overrides,
    },
  };
}

describe('isAuthorized', () => {
  it('accepts a matching header and rejects everything else', () => {
    expect(isAuthorized('secret-token', 'secret-token')).toBe(true);
    expect(isAuthorized('wrong', 'secret-token')).toBe(false);
    expect(isAuthorized('secret-token-extra', 'secret-token')).toBe(false);
  });

  it('fails closed when the secret or header is missing', () => {
    expect(isAuthorized('anything', undefined)).toBe(false);
    expect(isAuthorized('anything', '')).toBe(false);
    expect(isAuthorized(null, 'secret-token')).toBe(false);
    expect(isAuthorized(undefined, 'secret-token')).toBe(false);
  });
});

describe('parseWebhook', () => {
  it('normalises a valid event into RPC params', () => {
    const result = parseWebhook(event());
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.params).toEqual({
      p_event_id: 'evt_1',
      p_app_user_id: USER,
      p_type: 'INITIAL_PURCHASE',
      p_event_timestamp: new Date(1_700_000_000_000).toISOString(),
      p_period_end: new Date(1_700_600_000_000).toISOString(),
      p_store: 'APP_STORE',
      p_payload: {
        id: 'evt_1',
        type: 'INITIAL_PURCHASE',
        store: 'APP_STORE',
        environment: 'PRODUCTION',
      },
    });
  });

  it('allows a null period end (e.g. a refund with no expiry)', () => {
    const result = parseWebhook(event({ expiration_at_ms: null }));
    expect(result.ok && result.params.p_period_end).toBeNull();
  });

  it('rejects a non-UUID app user id (anonymous RevenueCat ids)', () => {
    const anon = parseWebhook(event({ app_user_id: '$RCAnonymousID:abc123' }));
    expect(anon.ok).toBe(false);
    const missing = parseWebhook(event({ app_user_id: null }));
    expect(missing.ok).toBe(false);
  });

  it('rejects missing id, type, or timestamp', () => {
    expect(parseWebhook(event({ id: null })).ok).toBe(false);
    expect(parseWebhook(event({ type: null })).ok).toBe(false);
    expect(parseWebhook(event({ event_timestamp_ms: null })).ok).toBe(false);
    expect(parseWebhook(event({ event_timestamp_ms: 0 })).ok).toBe(false);
  });

  it('rejects a body with no event envelope', () => {
    expect(parseWebhook({}).ok).toBe(false);
    expect(parseWebhook(null).ok).toBe(false);
    expect(parseWebhook('nope').ok).toBe(false);
  });
});
