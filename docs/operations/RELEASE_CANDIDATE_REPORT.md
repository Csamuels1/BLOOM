# Release-candidate report: automated security and quality matrix (#55)

> **Verdict: every automated and security check passes. BLOOM is NOT yet
> releasable**, because the open P0/P1 items in the risk register below need
> human, clinical, legal or store sign-off that automation cannot provide.

- Baseline: `main` at `1728e1c` (Phase 12 closed) plus the two security fixes
  in this change. Run on 2026-11-23.
- Re-run this matrix on the final candidate commit before tagging (#58).

## How to reproduce

```sh
npm run verify              # typecheck, lint, format, Jest, toolchain, deps
npm run test:coverage       # Jest with coverage summary
npm run audit:dependencies  # dependency-audit gate
npx supabase db reset && npx supabase test db   # migrations from clean + pgTAP
npx supabase db advisors    # security + performance advisors
npx expo-doctor && npm run export               # project health + iOS/Android/web build
```

## Results

| Check                                | Result                                                                                                           |
| ------------------------------------ | ---------------------------------------------------------------------------------------------------------------- |
| `npm run verify`                     | Pass: 94 suites, 662 Jest; 41 toolchain; deps up to date                                                         |
| Coverage                             | Statements 83.9%, branches 75.4%, functions 82.9%, lines 83.9%                                                   |
| Migrations from a clean reset        | Pass                                                                                                             |
| pgTAP                                | Pass: 198 tests across 19 files                                                                                  |
| Supabase advisors (security)         | No issues locally. Remote (hosted, newer linter): 5 intentional lint-0029 warnings, accepted in SECURITY_PATCHES |
| Supabase advisors (performance)      | No issues (2 warnings fixed in this change)                                                                      |
| Dependency-audit gate                | Pass: 2 allowlisted build-time advisories                                                                        |
| Secrets scan (all tracked files)     | Pass, with a self-check proving the scanner fires                                                                |
| Third-party telemetry or replay SDKs | None (toolchain guard)                                                                                           |
| expo-doctor / all-platform export    | 21/21, and export passes (verified at the Phase 12 gate; no app, native or config change since)                  |

## Findings fixed in this change

1. **Least-privilege grants (security).** Supabase's default privileges gave
   `anon` and `authenticated` every privilege on public tables, including
   **TRUNCATE**, which RLS does not govern, and gave EXECUTE on every function
   to `anon` (directly and via `PUBLIC`). Data was still protected, because RLS
   is on everywhere, every policy is `to authenticated`, and no exposed API
   reaches TRUNCATE, but it was a latent gap. It is the same class of issue that
   made server-only functions client-callable twice in Phase 10. Migration
   `20261123100000_least_privilege_grants.sql`:
   - `anon` now has no privilege on any public table, sequence or function;
   - `authenticated` has no TRUNCATE, TRIGGER or REFERENCES;
   - future tables and sequences default to least privilege.

   pgTAP `0019` guards it, and fails if any public function is ever
   anon-executable (the safety net for future function migrations).

2. **Duplicate permissive RLS policies (performance advisor).** `meals` and
   `support_resources` each had two permissive SELECT policies, so both ran on
   every query. They are merged into one equivalent policy per table, with
   access unchanged (pgTAP `0018`).

## Security inventory

- **RLS** is enabled on all 16 public tables, each with at least one policy
  (pgTAP `0005`). `anon` holds no table privileges (pgTAP `0019`).
- **SECURITY DEFINER functions** (all with a pinned `search_path`, all
  reviewed in SECURITY_PATCHES):

  | Function                                           | Who can call it               | Guard                                                                    |
  | -------------------------------------------------- | ----------------------------- | ------------------------------------------------------------------------ |
  | `apply_billing_event`                              | `service_role` only (webhook) | Idempotent, ordered and audited (`0013`)                                 |
  | `delete_current_user`                              | `authenticated`               | Refuses with no signed-in user; deletes only the caller                  |
  | `moderate_post`, `moderate_media`, `review_report` | `authenticated`               | `is_moderator()` from immutable `app_metadata`; audited (`0011`, `0012`) |

- **Server-only writers**: entitlement (`subscriptions`) is written only by the
  webhook (`0013`, `0014`). Crash reports are insert-only and never
  client-readable (`0017`).
- **Secrets**: none in tracked files. Only `.env.example` (names only) is
  tracked. No service-role key in the client (`web-only-moderation`,
  `secrets-scan` toolchain tests).
- **Telemetry**: first-party only, scrubbed on the device and again on the
  server, with a fixed schema (ADR-0014).

## Coverage and risk

Overall line coverage is 83.9%. The 26 route files are thin layout wrappers
(0% line coverage) whose screens are tested at the feature level. The
least-covered feature code, and its risk:

| Area                                               | Lines  | Risk and mitigation                                                                                                                         |
| -------------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `purchasesAdapter.native.ts` (RevenueCat SDK)      | 5%     | Native-only and mocked in unit tests. Covered by the live store matrix (ADR-0012), which is still outstanding. **Medium.**                  |
| Moderation queue UI and store                      | 51–61% | The access rules are enforced on the server and proven by pgTAP `0011`/`0012`; the UI gap affects staff convenience, not security. **Low.** |
| `SupportScreen`, `CycleScreen`                     | 59–60% | The core paths are tested (always-present fallback, server-truth toggle); untested branches are rendering variants. **Low.**                |
| `lib/supabase.ts`, `config/env.ts`, `AuthProvider` | 0–40%  | Thin wiring, mocked in tests and exercised by every authenticated flow. **Low.**                                                            |

## Risk register: open P0/P1 before release

| Item                                                          | Priority            | Needs                                                                                                                             |
| ------------------------------------------------------------- | ------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| #33 dietitian review of the meal catalogs (ADR-0010)          | P0                  | Qualified dietitian sign-off; meals stay inactive until then                                                                      |
| #50 clinical sign-off of safety values and wording (ADR-0013) | P0                  | Qualified clinician; guardrails are active on conservative defaults                                                               |
| #57 Nigeria and US legal, privacy and content review          | P0                  | Lawyer review, plus the **final Privacy policy and Terms text** (currently placeholders)                                          |
| #56 real-device and postpartum usability validation           | P1                  | Device matrix and usability sessions, including the Phase 12 device runtime audit and the deferred iOS acceptance (#58, ADR-0006) |
| Live store/sandbox matrix (ADR-0012)                          | Release requirement | RevenueCat, App Store and Play setup plus the webhook secret                                                                      |
| Moderation-operations sign-off (ADR-0011)                     | Release requirement | Approved rules and escalation, plus staffing, before the community opens                                                          |
| #58 Phase 13 gate; Phase 14 (#59–#62)                         | P0/P1               | Everything above, then signed builds and store submission                                                                         |

Until these close, #55's "no P0 or P1 remains" criterion cannot be met, so #55
stays open and this matrix is re-run on the final candidate.
