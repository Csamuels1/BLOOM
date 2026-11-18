import type { AppSupabaseClient } from '@/lib/supabase';
import { fetchEntitlement } from '@/features/subscription/entitlementService';
import {
  ENTITLEMENT_TTL_MS,
  selectIsPro,
  useSubscriptionStore,
} from '@/features/subscription/subscriptionStore';

function clientReturning(data: unknown, error: unknown = null) {
  return {
    from: () => ({
      select: () => ({
        maybeSingle: async () => ({ data, error }),
      }),
    }),
  } as unknown as AppSupabaseClient;
}

const A = 'user-a';
const B = 'user-b';

describe('fetchEntitlement', () => {
  it('maps pro/active and pro/in_grace to Pro', async () => {
    expect(
      await fetchEntitlement(
        clientReturning({
          tier: 'pro',
          status: 'active',
          current_period_end: 'x',
        }),
      ),
    ).toEqual({
      tier: 'pro',
      status: 'active',
      isPro: true,
      currentPeriodEnd: 'x',
    });
    expect(
      (
        await fetchEntitlement(
          clientReturning({
            tier: 'pro',
            status: 'in_grace',
            current_period_end: null,
          }),
        )
      )?.isPro,
    ).toBe(true);
  });

  it('treats free, expired, or missing rows as not Pro', async () => {
    expect(
      (
        await fetchEntitlement(
          clientReturning({
            tier: 'free',
            status: 'active',
            current_period_end: null,
          }),
        )
      )?.isPro,
    ).toBe(false);
    expect(
      (
        await fetchEntitlement(
          clientReturning({
            tier: 'pro',
            status: 'expired',
            current_period_end: null,
          }),
        )
      )?.isPro,
    ).toBe(false);
    const none = await fetchEntitlement(clientReturning(null));
    expect(none).toEqual({
      tier: 'free',
      status: 'active',
      isPro: false,
      currentPeriodEnd: null,
    });
  });

  it('returns null (not a confirmed Free) when the read fails', async () => {
    expect(
      await fetchEntitlement(clientReturning(null, { code: '500' })),
    ).toBeNull();
  });
});

describe('subscription store + selectIsPro', () => {
  beforeEach(() => useSubscriptionStore.getState().clear());

  it('caches the entitlement for the user it was read for', async () => {
    await useSubscriptionStore.getState().load(
      clientReturning({
        tier: 'pro',
        status: 'active',
        current_period_end: null,
      }),
      A,
    );
    const s = useSubscriptionStore.getState();
    expect(s.ownerId).toBe(A);
    expect(s.entitlement?.isPro).toBe(true);
    expect(selectIsPro(s, A)).toBe(true);
  });

  it('never reports Pro for a different user than the cache holds (no leak)', async () => {
    await useSubscriptionStore.getState().load(
      clientReturning({
        tier: 'pro',
        status: 'active',
        current_period_end: null,
      }),
      A,
    );
    expect(selectIsPro(useSubscriptionStore.getState(), B)).toBe(false);
  });

  it('expires a stale cache (offline cache expiry) and fails safe to Free', async () => {
    await useSubscriptionStore.getState().load(
      clientReturning({
        tier: 'pro',
        status: 'active',
        current_period_end: null,
      }),
      A,
    );
    const s = useSubscriptionStore.getState();
    const justFresh = (s.checkedAt ?? 0) + ENTITLEMENT_TTL_MS - 1;
    const justStale = (s.checkedAt ?? 0) + ENTITLEMENT_TTL_MS + 1;
    expect(selectIsPro(s, A, justFresh)).toBe(true);
    expect(selectIsPro(s, A, justStale)).toBe(false);
  });

  it('keeps a fresh cache on a failed refresh for the same user', async () => {
    await useSubscriptionStore.getState().load(
      clientReturning({
        tier: 'pro',
        status: 'active',
        current_period_end: null,
      }),
      A,
    );
    await useSubscriptionStore
      .getState()
      .load(clientReturning(null, { code: '500' }), A);
    const s = useSubscriptionStore.getState();
    expect(s.status).toBe('error');
    expect(selectIsPro(s, A)).toBe(true); // still within TTL
  });

  it('drops the cache the moment the user changes or signs out', async () => {
    await useSubscriptionStore.getState().load(
      clientReturning({
        tier: 'pro',
        status: 'active',
        current_period_end: null,
      }),
      A,
    );

    useSubscriptionStore.getState().syncUser(B);
    expect(useSubscriptionStore.getState().entitlement).toBeNull();
    expect(selectIsPro(useSubscriptionStore.getState(), B)).toBe(false);

    // Sign-out (null) also clears.
    await useSubscriptionStore.getState().load(
      clientReturning({
        tier: 'pro',
        status: 'active',
        current_period_end: null,
      }),
      A,
    );
    useSubscriptionStore.getState().syncUser(null);
    expect(useSubscriptionStore.getState().ownerId).toBeNull();
  });

  it('starts a cross-user load clean instead of showing the old value', async () => {
    await useSubscriptionStore.getState().load(
      clientReturning({
        tier: 'pro',
        status: 'active',
        current_period_end: null,
      }),
      A,
    );
    // A failing load for B must not surface A's Pro.
    await useSubscriptionStore
      .getState()
      .load(clientReturning(null, { code: '500' }), B);
    expect(selectIsPro(useSubscriptionStore.getState(), B)).toBe(false);
    expect(selectIsPro(useSubscriptionStore.getState(), A)).toBe(false);
  });
});
