# ADR-0014: First-Party, Sanitized Telemetry (No Third-Party SDKs)

- Status: Accepted
- Date: 2026-11-19

## Context

Phase 12 (#53) needs crash reporting and product analytics. BLOOM stores
weight, cycle, pregnancy and postpartum context, which are sensitive health and
reproductive data. Third-party telemetry SDKs often collect device data,
breadcrumbs, user properties or session replays by default, and every vendor
that receives this data needs its own data-processing review.

## Decision

The owner chose first-party telemetry only:

- **Crash reports** go to BLOOM's own Supabase table, `client_crash_reports`.
  Each report is scrubbed on the device before it is sent (emails, tokens, ids,
  URL query strings, device usernames in paths, and every number in the message
  or in the stack-header lines are redacted). The schema is fixed:
  `error_name`, `message`, `stack`, `app_version`, `platform`. Nothing else is
  ever sent: no context object, no breadcrumbs, no user properties, no
  screenshots. Clients can only insert their own reports and can never read,
  change or delete them. A server-side trigger scrubs again as defence in depth.
  Reports are rate-limited and de-duplicated per session, and reporting never
  throws.
- **Analytics** uses the existing allowlist (`analytics_event_types` foreign
  key). An event is only an allowlisted name plus the user's id. The client
  `track()` takes no properties argument, nothing is sent while signed out,
  events are never client-readable, and a toolchain test keeps the client and
  server allowlists identical.
- **There is no session replay**, and no third-party telemetry, analytics or
  replay SDK may be added. A toolchain test fails if one appears in the
  dependencies or the source.

## Consequences

- No third party ever receives BLOOM user data through telemetry.
- There is no hosted dashboard, symbolication or alerting. Crashes are read with
  the service role (for example from the Supabase dashboard). Adding a vendor
  later would need a new ADR and a privacy review, and would have to keep the
  same scrubbing and fixed schema.
- Fatal native crashes can end the process before an asynchronous report is
  sent, so some fatal crashes may be missed. That is accepted for privacy.
