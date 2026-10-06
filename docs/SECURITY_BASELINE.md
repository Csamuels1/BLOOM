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
