# Security and Privacy Baseline

## Data classification

Treat the following as sensitive:

- Account identifiers and authentication state
- Weight and body measurements
- Postpartum, pregnancy, feeding, cycle, and activity context
- Meals, allergens, dietary preferences, and notes
- Community text, images, reports, blocks, and moderation records
- Progress photos
- Support-resource interactions

Precise location is not collected. Product analytics must not contain any sensitive field above.

## Authorization

- Deny access by default.
- Enable RLS on every table exposed through the Supabase Data API.
- Grant only required operations and pair them with operation-specific policies.
- Test allowed and denied behavior for anonymous users, resource owners, other users, moderators, and administrators.
- Use `app_metadata` for staff authorization and account for JWT refresh latency.
- Enforce Free/Pro access server-side; hidden UI is not authorization.
- Keep privileged functions outside exposed schemas and restrict execution explicitly.

### Safety guardrails and concerning-pattern signals (issues #47, #48)

- Protective boundaries (calorie floor 1200, loss pace ≤ 1 kg/week) are versioned and enforced at the computation layer, not the UI; the floor only ever raises a range and cannot be bypassed (pgTAP via the plan calculator, Jest fuzz).
- Concerning-pattern evaluation is **server-side** (`evaluate_safety_signals`, SECURITY INVOKER + RLS): it reads only the caller's own data, takes no user id, triggers only on **complete data over a real span** (no false alarms from sparse data), is **versioned**, and emits **non-diagnostic signal codes only** — never a diagnosis or condition (pgTAP `0015`). The client maps codes to gentle, reviewed copy and ignores unknown codes.
- Threshold values are conservative defaults pending clinical sign-off (#50); the completeness, server-side, own-data-only, and no-diagnosis guarantees hold independent of the specific numbers.

### Entitlement enforcement (issues #44, #45)

- The entitlement source of truth is the `subscriptions` mirror, written **only** by the RevenueCat webhook through `apply_billing_event` (service role); clients have no insert/update grant, so no account can self-upgrade. Proven by pgTAP `0013` and `0014`.
- Every premium action is enforced at the server/data boundary, not in the UI. Community posting and reactions require `is_pro()` in RLS (#119, pgTAP `0011`); the client `is_pro`/entitlement value is advisory and only decides what UI to show.
- A member reads only their own subscription row (RLS select-own); entitlement never leaks across accounts at the data layer (pgTAP `0014`).
- **Offline cache expiry:** the client caches the entitlement for at most `ENTITLEMENT_TTL_MS` (24h) and keys it to the signed-in user. After the TTL, on a failed read with no fresh cache, or for a different user, it falls back to Free (least privilege) until it re-verifies with the server.
- **Account switching:** the cache is cleared on sign-out and whenever the signed-in user id changes, and a mismatched user can never read another user's cached Pro (`selectIsPro` is user- and freshness-checked).

## Storage

- Progress photos are private to their owner.
- Community images remain private while pending moderation.
- Use short-lived signed URLs when a private object must be displayed.
- Validate file type, size, path ownership, and moderation state.
- Deleting an account must remove or irreversibly anonymize associated private objects according to the approved retention policy.

## Authentication and account lifecycle

- Require email verification and an 18+ eligibility confirmation.
- Support password reset, sign-out, session expiry, account export, and deletion.
- Revoke active sessions during sensitive account actions where current platform capabilities allow.
- Never authorize from user-editable profile or `user_metadata` fields.

## Community protection

- Support reporting, blocking, user deletion, moderation status, and immutable audit history.
- Do not make pending images public.
- Do not expose reporter identity to the reported user.
- Do not expose moderation endpoints to ordinary authenticated users.

## Telemetry

- Crash diagnostics are sanitized before transmission.
- Product events use a fixed allowlist with no arbitrary property bags.
- Never record weight, meals, cycle/postpartum values, free text, images, email, precise location, auth tokens, or database payloads.
- Disable session replay unless a separate privacy review and explicit user consent are approved.

## Release security gate

- Dependency and secret scans pass.
- Database advisors and RLS tests pass.
- No service credentials are present in the bundle.
- Data export and deletion are verified.
- Production environment and rollback procedures are reviewed.
- Legal and privacy disclosures match actual collection and processing.
