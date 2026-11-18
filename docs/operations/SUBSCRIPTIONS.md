# Subscriptions — architecture and activation

How BLOOM Pro works end to end, and what the owner must set up to turn on real
purchasing. Live store/sandbox verification is deferred by
[ADR-0012](../adr/0012-defer-store-sandbox-verification.md); the engineering is
complete and tested.

- Related: Phase 10 issues #43 (paywall/SDK), #44 (webhook/mirror), #45
  (enforcement), #46 (gate); [SECURITY_BASELINE.md](../SECURITY_BASELINE.md);
  [ENVIRONMENTS_AND_SECRETS.md](../ENVIRONMENTS_AND_SECRETS.md).

## Architecture

1. **Client (paywall, #43).** `react-native-purchases` shows the store's own
   localized prices and runs purchase/restore. It configures with
   `appUserID = Supabase user id`, so RevenueCat and our mirror agree on who the
   user is. The client entitlement is **advisory** (UI only).
2. **RevenueCat → webhook (#44).** On any entitlement change RevenueCat POSTs to
   the `revenuecat-webhook` Supabase Edge Function. The function verifies a
   shared-secret `Authorization` header (fails closed), then calls
   `apply_billing_event` with the service role. Application is **idempotent**
   (event id is the key), **ordered** (a stale event never overwrites newer
   state), and **audited** (`billing_events`).
3. **Mirror + enforcement (#45).** `apply_billing_event` is the only writer of
   the `subscriptions` row; clients have no write grant. `is_pro()` reads the
   mirror, and premium actions (community posting/reactions) are enforced in RLS.
   The client caches the entitlement per user with a 24h TTL and clears it on
   sign-out / account switch.

The server is always the authority; a client cannot grant itself Pro or read
another account's entitlement (pgTAP `0013`, `0014`).

## Owner activation checklist (both platforms)

Purchasing is unavailable until these are done. None of it is in the repo.

1. **RevenueCat dashboard**
   - Create the `pro` entitlement and an offering with the monthly and annual
     packages.
   - Add the iOS and Android apps; copy their **public SDK keys** into
     `EXPO_PUBLIC_REVENUECAT_IOS_API_KEY` / `EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY`
     (public, client-side).
   - Configure the webhook to the deployed function URL and set the
     Authorization secret (next step).
2. **Supabase (server-side secrets)**
   - `supabase secrets set REVENUECAT_WEBHOOK_SECRET=…` (identical to the
     RevenueCat webhook Authorization value).
   - `supabase functions deploy revenuecat-webhook --no-verify-jwt`.
3. **App Store Connect (iOS)**
   - Create the auto-renewable subscription products matching the RevenueCat
     product ids; add them to a subscription group.
   - Create a sandbox tester; agreements/banking must be active.
4. **Google Play Console (Android)**
   - Create the subscription products matching the RevenueCat product ids.
   - Add license testers for sandbox purchases.
5. **Build** a dev/internal build on each platform (purchasing is a native
   module; it does not run in Expo Go, and iOS runtime is deferred to #58).

## Deferred live verification (ADR-0012, tracked on #46 / #58)

Run on each platform once the above is set up, and record the result:

- Purchase (monthly and annual), entitlement unlocks.
- Restore on a fresh install.
- Cancellation — access continues until period end.
- Refund — access is removed.
- Expiry — drops to Free.
- Webhook — each of the above produces the expected `billing_events` row and
  mirror state (idempotent on retry, correct on out-of-order delivery).

Until this is done and the [moderation-ops sign-off](MODERATION_OPERATIONS.md) is
complete, Pro is not sold and the community stays closed to real users.
