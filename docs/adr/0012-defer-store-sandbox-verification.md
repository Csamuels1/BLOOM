# ADR-0012: Defer Live Store / Sandbox Subscription Verification (Owner-Approved)

- Status: Accepted
- Date: 2026-11-18

## Context

Phase 10 delivers subscriptions: the client paywall and RevenueCat SDK (#43),
the signed idempotent webhook and subscription mirror (#44), and server-side
Free/Pro enforcement (#45). The Phase 10 exit gate (#46) asks that purchase,
restore, cancellation, refund, and expiry be verified on **both** stores.

That live verification needs owner-side setup that is not in place at this stage
of the build:

- RevenueCat dashboard: the `pro` entitlement, offerings, and products.
- App Store Connect and Google Play: the actual subscription products, plus
  sandbox/test accounts.
- Supabase: the `REVENUECAT_WEBHOOK_SECRET` and the deployed webhook function.
- A dev build on each platform (purchasing is a native module; iOS runtime is
  itself already deferred to #58 under ADR-0006).

The owner has decided to complete the Phase 10 engineering and its exit gate now,
with the live store/sandbox matrix verified when that setup is arranged — the
same owner-approved, explicitly recorded deferral as ADR-0006 (iOS), ADR-0010
(dietitian), and ADR-0011 (moderation operations), not a waiver.

## Decision

Pass the Phase 10 engineering exit gate with the **live store/sandbox
verification deferred**, under these conditions:

- The purchase/restore/cancellation/refund/expiry behaviour is covered now by
  **unit and contract tests against the server boundary and the pure client
  logic**, which do not need a live store:
  - Webhook application — idempotency, ordering, refund→expired, expiry→free,
    and the server-only trust boundary — is proven by pgTAP `0013`.
  - Entitlement enforcement — own-row-only visibility, no self-upgrade, no
    cross-account leak, `is_pro` truth — by pgTAP `0014` (and posting gates by
    `0011`).
  - Paywall mapping, purchase/restore/cancel handling, and the offline cache
    (TTL, account-switch) by the Jest `paywall`, `purchases-store`,
    `paywall-ui`, and `entitlement` suites.
- The entitlement is **server-authoritative** and the community stays closed to
  real users (no account is Pro until this setup lands, and even then the
  moderation-ops sign-off of ADR-0011 is required), so there is no path by which
  an unverified purchase flow affects real users.
- No secret or store credential is committed; the webhook secret and service key
  stay server-side (ADR-0008, SECURITY_BASELINE). `EXPO_PUBLIC_REVENUECAT_*` are
  public SDK keys only.
- The deferred live matrix is recorded against #46 and #58 (iOS runtime), with
  both platforms' activation steps documented in
  [SUBSCRIPTIONS.md](../operations/SUBSCRIPTIONS.md). When the owner provides the
  store setup and secret, the sandbox matrix (purchase, restore, cancellation,
  refund, expiry) is run on each platform, the result is recorded, and the
  deferral is lifted.

This deferral covers **live store/sandbox verification only**. All engineering
gates (migrations from a clean reset, pgTAP, advisors, `verify`, `expo-doctor`,
all-platform export) still apply and must pass for Phase 10 to close.

## Consequences

- Phase 10 is engineering- and security-complete: an auditable webhook mirror, a
  server-authoritative entitlement that cannot be forged or leaked, and a paywall
  that shows real store prices and handles purchase/restore — all proven without
  a live store.
- Real purchasing cannot happen until the owner configures the stores, the
  RevenueCat dashboard, and the webhook secret; until then purchasing is simply
  unavailable (the paywall says so), which is the safe default.
- The outstanding live matrix is visible and tracked (#46, #58), not silently
  skipped. Risk accepted: store-specific behaviours (receipt validation quirks,
  billing-retry/grace timing, refund propagation latency) are not yet exercised
  end-to-end and must be before a release that sells Pro.
