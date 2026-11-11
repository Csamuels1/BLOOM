# BLOOM Build Status

This file is the repository-level view of the [BLOOM MVP project](https://github.com/users/Csamuels1/projects/1) and phase milestones. GitHub issues are the source of truth for individual deliverables.

## Status legend

- `[ ]` Not started
- `[~]` In progress
- `[x]` Complete and phase gate passed
- `[!]` Blocked by an explicit dependency

## Phase progress

- [x] Phase 0: Repository and Product Foundation
- [x] Phase 1: Expo and Design-System Setup (iOS verification deferred—not passed, #58)
- [x] Phase 2: Supabase Authentication (iOS verification deferred—not passed, #58)
- [x] Phase 3: Onboarding UI (iOS verification deferred—not passed, #58)
- [~] Phase 4: Supabase Schema and Profile Persistence
- [ ] Phase 5: Home with Mock Meals
- [ ] Phase 6: Weight Logging and Progress
- [ ] Phase 7: Real Meal Recommendations
- [ ] Phase 8: Cycle and Postpartum Context
- [ ] Phase 9: Community and Moderation
- [ ] Phase 10: RevenueCat Subscriptions
- [ ] Phase 11: Safety Guardrails
- [ ] Phase 12: Product Polish
- [ ] Phase 13: Release Qualification
- [ ] Phase 14: Store-Ready Release

## Owner-approved iOS deferral

On 2026-10-07 the owner deferred iOS-specific verification, builds, and fixes from Phases 1–12 to [Phase 13 gate #58](https://github.com/Csamuels1/BLOOM/issues/58). See [ADR-0006](adr/0006-defer-ios-qualification.md). Earlier gates require all non-iOS acceptance and an explicit "iOS verification deferred—not passed" record, with outstanding iOS tests carried into #58. The smoke workflow is manual-only until restored for qualification. Cross-platform implementation and bundle checks remain. Security and other platform gates are not waived.

## Current phase: Phase 4

- Phase 3 closed on 2026-11-10 (iOS verification deferred—not passed, #58).
- Done: [#17 profile/measurement/cycle/preference schema](https://github.com/Csamuels1/BLOOM/issues/17) (PR #82). Active: [#18 remaining schema](https://github.com/Csamuels1/BLOOM/issues/18). Then [#19 RLS + Storage policies](https://github.com/Csamuels1/BLOOM/issues/19), [#20 onboarding persistence + export/deletion](https://github.com/Csamuels1/BLOOM/issues/20), and the [#21 database exit gate](https://github.com/Csamuels1/BLOOM/issues/21). The onboarding draft persists to an RLS-protected profile in #20.

Issue #18 progress (2026-11-11): the remaining product schema in migration `20261111061014_product_catalog_community_subscriptions.sql`. Tables: `meals` (regional catalog with **sourcing + safety-review metadata**, calories as a range, allergen/dietary arrays, version + active-requires-approved), `support_resources` (verified regional, review metadata, version), `subscriptions` (per-user Free/Pro entitlement), `community_posts`/`post_reactions`/`post_reports`/`user_blocks` (community with moderation states), `moderation_actions` (append-only audit), and `analytics_event_types` + `analytics_events` (fixed allowlist via FK — no arbitrary property bags, per SECURITY_BASELINE). Audit (`created_at`/`updated_at`, triggers) and version fields support traceability; **RLS enabled deny-by-default** on all ten tables (grants/policies are #19). Verified on a fresh local stack: both migrations apply, **32 pgTAP tests pass** across both suites (`npm run test:db`), and regenerated `src/types/database.ts` compiles. Local-dev note: `supabase/config.toml` disables the analytics service locally (its docker.io images are DNS-flaky and blocked the stack); nothing is applied to the live project.

Issue #17 progress (2026-11-11): the first schema migration. `supabase init` set up `supabase/` (config, migrations, pgTAP tests); `supabase` CLI 3.1.0 is pinned as a devDep with `db:reset`/`db:types`/`test:db` scripts. Migration `20261110214118_profile_measurement_cycle_preference.sql` creates `profiles` (one private row per `auth.users`, onboarding-derived fields, canonical height in cm, value constraints incl. postpartum-months-requires-status, updated_at trigger), `weight_measurements` (canonical kg), and `cycle_logs` (unique start per user), each with ownership FKs, indexes, and **RLS enabled deny-by-default** (grants/policies are #19). Verified on the local stack: migration applies to a freshly-initialized DB, 14 pgTAP constraint tests pass (`npm run test:db`), and generated types (`src/types/database.ts`) compile. Local-dev note: Docker image pulls here are DNS-flaky, so the full-stack `supabase start`/`db reset` needs a minimal-services boot and retries (see DEVELOPMENT.md); nothing is applied to the live project — pushing migrations to the cloud is an approval-gated step at the #21 gate.

## Completed phase gate: Phase 3

Phase 3 (Onboarding UI) closed on 2026-11-10 with all issues complete and the non-iOS exit gate passed ([#16](https://github.com/Csamuels1/BLOOM/issues/16)). iOS verification is deferred—not passed (recorded in #58 per ADR-0006).

- [#12 framework](https://github.com/Csamuels1/BLOOM/issues/12) (PR #77): typed, resumable onboarding engine — data-first step flow with conditional navigation, a zod draft, an AsyncStorage-persisted Zustand store, and a React Hook Form binding. No backend writes.
- [#13 welcome + goal](https://github.com/Csamuels1/BLOOM/issues/13) (PR #78): store-driven host at `(app)/onboarding`, brand/tagline welcome, three equal goal cards (no BMI/scale), reusable `ChoiceCard`.
- [#14 pregnancy/postpartum/feeding](https://github.com/Csamuels1/BLOOM/issues/14) (PR #79): a pregnant user routes to a care boundary with no target plan; conditional postpartum months; optional feeding; prefer-not-to-say first-class.
- [#15 stats/region/dietary/cycle](https://github.com/Csamuels1/BLOOM/issues/15) (PR #80): height validation, locale-defaulted region/units (no GPS, `expo-localization`), dietary/allergen multi-select with disclaimer, optional cycle, draft preview.
- [#16 plan reveal + gate](https://github.com/Csamuels1/BLOOM/issues/16): a gentle, narrative-led plan reveal — a calorie **range** (illustrative, professionally-reviewed guidance is Phase 7/11), three mock regional meals, and a finish CTA. All local, no backend on any path.

Phase 3 exit-gate checklist (from a clean `npm ci` install):

- [x] Every Phase 3 issue complete (#12–#15 closed; #16 plan reveal built)
- [x] Green `verify`: type, lint, format, 132 Jest tests, 27 toolchain tests, `check:dependencies`
- [x] Dependency audit gate passes (4 allowlisted build-time advisories)
- [x] `expo-doctor` 21/21 and all-platform `expo export` (android/ios/web, 18 routes)
- [x] Complete onboarding E2E passes without backend access (`complete-flow` host walkthrough welcome→finish); prohibited-copy scan green (`copy.test`)
- [x] Narrative-led, range-based plan reveal with three mock meals and a CTA
- [x] iOS runtime/device onboarding E2E deferred—not passed (#58)

The onboarding draft is local-only in Phase 3; persisting it to an RLS-protected profile is Phase 4.

## Completed phase gate: Phase 2

Phase 2 (Supabase Authentication) closed on 2026-11-10 with all issues complete and the non-iOS exit gate passed ([#11](https://github.com/Csamuels1/BLOOM/issues/11)). iOS verification is deferred—not passed (recorded in #58 per ADR-0006).

- Completed [#8 Supabase environments](https://github.com/Csamuels1/BLOOM/issues/8) (PR #71): zod-validated public `EXPO_PUBLIC_*` config with a fail-fast loader; live project connectivity verified.
- Completed [#9 auth client + protected routing](https://github.com/Csamuels1/BLOOM/issues/9) (PR #72): lazy Supabase client (publishable key only, AsyncStorage session, foreground auto-refresh), an `onAuthStateChange`-driven store, and `Stack.Protected` route groups that keep protected routes out of the navigation tree when signed out.
- Completed [#10 registration + recovery](https://github.com/Csamuels1/BLOOM/issues/10) (PR #75): accessible sign-in, 18+-gated registration, email verification, password reset/update, and sign-out, with neutral non-enumerating errors.
- CI reliability: [#73](https://github.com/Csamuels1/BLOOM/issues/73) (PR #74) authenticated and hardened the markdown link check.

Phase 2 exit-gate checklist (from a clean `npm ci` install):

- [x] Every Phase 2 issue complete (#8, #9, #10 closed)
- [x] Green `verify`: type, lint, format, 72 Jest tests, 27 toolchain tests, `check:dependencies` ("up to date")
- [x] Dependency audit gate passes (4 allowlisted build-time Expo advisories)
- [x] `expo-doctor` 21/21 and all-platform `expo export` succeed (android/ios/web bundles, 16 routes)
- [x] Automated auth tests pass (auth-store, auth-service, registration-flow, sign-in-flow, protected-routing)
- [x] Android/web auth flows exercised via unit/integration tests and bundle export; iOS runtime verification deferred—not passed (#58)
- [x] CI green on `main` (Application and Repository checks)

The owner allow-listed the `bloom://sign-in` and `bloom://update-password` redirect URLs in the Supabase dashboard (DEVELOPMENT.md) so verification and reset emails return to the app.

## Completed phase gate: Phase 1

Phase 1 (Expo and Design-System Setup) closed on 2026-11-08 with all issues complete and the non-iOS exit gate passed. iOS verification is deferred—not passed (recorded in #58 per ADR-0006).

- Completed [#4 Expo foundation and EAS profiles](https://github.com/Csamuels1/BLOOM/issues/4) (PR #66): fixed the shipped `zod` advisory (4.6.7); replaced the always-failing audit with an owner-approved allowlist gate ([ADR-0007](adr/0007-dependency-audit-allowlist.md)); aligned Expo SDK 57 patch releases so `check:dependencies` passes; retired the node-forge patch (fixed upstream in 1.4.3) and the obsolete xcode→uuid override.
- Completed [#5 design system](https://github.com/Csamuels1/BLOOM/issues/5) (PR #67): `src/design/tokens.ts` mirrored in `tailwind.config.js` (drift-guarded), reusable accessible components (`Typography`, `Button`, `Pill`, `Card`, `SafetyNotice`), reduced-motion hook. See [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md).
- Completed [#6 brand assets](https://github.com/Csamuels1/BLOOM/issues/6) (PRs #68, #69): original blossom mark + Fraunces wordmark, icon/adaptive/splash/favicon, OFL Fraunces/Manrope fonts loaded and applied per-variant. Owner approval recorded 2026-11-08.
- Completed exit gate [#7](https://github.com/Csamuels1/BLOOM/issues/7).

Phase 1 exit-gate checklist:

- [x] All Phase 1 issues complete (#4, #5, #6)
- [x] Clean install (`npm ci`) succeeds with patches applied
- [x] Green verification from clean install: type, lint, format, 31 Jest tests, 27 toolchain tests, `check:dependencies`
- [x] Dependency audit gate passes (4 allowlisted build-time advisories)
- [x] `expo-doctor` 21/21 and all-platform `expo export` pass
- [x] Approved brand assets linked (#6 owner approval) and Android/web evidence (bundle export); iOS verification deferred—not passed (#58)
- [x] CI green on `main` (Application and Repository checks)

## Completed phase gate: Phase 0

- Completed bootstrap: [#1](https://github.com/Csamuels1/BLOOM/issues/1), delivered in commit `d9630e4`.
- Completed licensing decision: [#2](https://github.com/Csamuels1/BLOOM/issues/2), published through [PR #64](https://github.com/Csamuels1/BLOOM/pull/64). Continue without an open-source license for now; repository visibility remains public.
- Completed exit gate: [#3](https://github.com/Csamuels1/BLOOM/issues/3), merged through [PR #65](https://github.com/Csamuels1/BLOOM/pull/65) with owner approval.

- [x] Repository foundation files reviewed
- [x] GitHub Project, labels, milestones, and issues created
- [x] Initial CI check passes
- [x] Initial commit explicitly approved
- [x] Initial push explicitly approved
- [x] `main` branch protection enabled after the first push
- [x] Phase 0 bootstrap review approved through the owner's initial commit and push approvals
- [x] Exit-gate documentation PR passes CI and receives merge approval
- [x] Phase 0 milestone closed

Phase 0 closed on 2026-10-07 with all three issues complete.

## Verification evidence

Verified on 2026-10-07:

- [Repository checks passed on merged main](https://github.com/Csamuels1/BLOOM/actions/runs/37614548605), commit `c5d6b88`.
- Branch protection requires pull requests, an up-to-date branch, the `repository-policy` check, and resolved conversations. Protection applies to administrators; force pushes and branch deletion are disabled.
- GitHub does not require an additional approving reviewer for this single-owner repository. Explicit owner merge permission remains required by AGENTS.md.
- The project contains 62 issues across 15 milestones. All items have Phase, Workflow, Area, Platform, Priority, Release blocker, and Assignees populated. Assignees is the owner field.
- Issues #1, #2, and #3 are complete; milestone 1 is closed with no open issues.

The owner authorized starting issue #4 after the Phase 0 gate merged. [Post-merge CI passed](https://github.com/Csamuels1/BLOOM/actions/runs/37615725496) on `e7d7caf`.

## Milestone and exit-gate index

| Phase | Milestone                                                                | Exit gate                                           |
| ----- | ------------------------------------------------------------------------ | --------------------------------------------------- |
| 0     | [Repository foundation](https://github.com/Csamuels1/BLOOM/milestone/1)  | [#3](https://github.com/Csamuels1/BLOOM/issues/3)   |
| 1     | [Expo and design system](https://github.com/Csamuels1/BLOOM/milestone/2) | [#7](https://github.com/Csamuels1/BLOOM/issues/7)   |
| 2     | [Authentication](https://github.com/Csamuels1/BLOOM/milestone/3)         | [#11](https://github.com/Csamuels1/BLOOM/issues/11) |
| 3     | [Onboarding](https://github.com/Csamuels1/BLOOM/milestone/4)             | [#16](https://github.com/Csamuels1/BLOOM/issues/16) |
| 4     | [Schema and persistence](https://github.com/Csamuels1/BLOOM/milestone/5) | [#21](https://github.com/Csamuels1/BLOOM/issues/21) |
| 5     | [Home](https://github.com/Csamuels1/BLOOM/milestone/6)                   | [#24](https://github.com/Csamuels1/BLOOM/issues/24) |
| 6     | [Weight and progress](https://github.com/Csamuels1/BLOOM/milestone/7)    | [#28](https://github.com/Csamuels1/BLOOM/issues/28) |
| 7     | [Meal recommendations](https://github.com/Csamuels1/BLOOM/milestone/8)   | [#33](https://github.com/Csamuels1/BLOOM/issues/33) |
| 8     | [Cycle and postpartum](https://github.com/Csamuels1/BLOOM/milestone/9)   | [#37](https://github.com/Csamuels1/BLOOM/issues/37) |
| 9     | [Community](https://github.com/Csamuels1/BLOOM/milestone/10)             | [#42](https://github.com/Csamuels1/BLOOM/issues/42) |
| 10    | [Subscriptions](https://github.com/Csamuels1/BLOOM/milestone/11)         | [#46](https://github.com/Csamuels1/BLOOM/issues/46) |
| 11    | [Safety](https://github.com/Csamuels1/BLOOM/milestone/12)                | [#50](https://github.com/Csamuels1/BLOOM/issues/50) |
| 12    | [Polish](https://github.com/Csamuels1/BLOOM/milestone/13)                | [#54](https://github.com/Csamuels1/BLOOM/issues/54) |
| 13    | [Release qualification](https://github.com/Csamuels1/BLOOM/milestone/14) | [#58](https://github.com/Csamuels1/BLOOM/issues/58) |
| 14    | [Store readiness](https://github.com/Csamuels1/BLOOM/milestone/15)       | [#62](https://github.com/Csamuels1/BLOOM/issues/62) |

## External release gates

These gates cannot be waived for `v1.0.0`:

- Qualified clinician/dietitian approval of calculations, meal content, health copy, safety thresholds, and support resources
- Legal approval of privacy, terms, consumer-health-data handling, and store disclosures for Nigeria and the United States
- Owner approval of final brand assets
- Moderator staffing and response process
- Apple Developer, Google Play, Expo/EAS, Supabase, RevenueCat, and crash-reporting production access
