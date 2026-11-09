# ADR-0008: Supabase environment strategy

- Status: Accepted by owner
- Date: 2026-11-09
- Tracking: [#8](https://github.com/Csamuels1/BLOOM/issues/8)

## Context

Phase 2 introduces Supabase. ENVIRONMENTS_AND_SECRETS.md requires separate
Supabase projects per environment (local, staging, production) and forbids any
service-role or secret key in client code, env, logs, or VCS. The owner wants to
develop against a live Supabase project from the start, and is a single owner
without a production user base yet.

## Decision

Start with **one real Supabase cloud project now**, used as the dev/staging
environment, and create a **separate production project before launch**
(Phase 13/14). Production is never used for development or experimentation.

- Client configuration is read only from `EXPO_PUBLIC_*` variables via
  `src/config/env.ts`, which validates the Supabase URL and publishable (anon)
  key and fails fast with a clear message when unset.
- Values live in a gitignored `.env` locally and in EAS environment values /
  the CI secret store for builds. `.env.example` documents the names only.
- The Supabase **publishable (anon)** key is public and protected by row-level
  security; it is the only Supabase key the client ever holds. The
  **service-role** key is never read by the client and never committed.
- `EXPO_PUBLIC_APP_ENV` records which environment a build targets
  (`local` | `staging` | `production`).
- A local Supabase (Docker) stack is optional and not required by this decision;
  it can be added later without changing the client contract.
- Database migrations, RLS policies, and generated types are created in Phase 4;
  this ADR covers only environment configuration.

## Consequences

Development proceeds against a live project immediately, with a single set of
public keys to manage now. A production project, its keys, migration promotion,
and database advisors must be set up and approved before any production release;
until then, only synthetic or consented test data is used, per
ENVIRONMENTS_AND_SECRETS.md.
