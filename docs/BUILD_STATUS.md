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
- [x] Phase 4: Supabase Schema and Profile Persistence (non-iOS gate passed 2026-11-11; live migration push applied 2026-11-12)
- [x] Phase 5: Home with Mock Meals (iOS verification deferred—not passed, #58)
- [x] Phase 6: Weight Logging and Progress (non-iOS gate passed 2026-11-12, #28; iOS verification deferred—not passed, #58)
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

## Current phase: Phase 7

- Phase 6 closed on 2026-11-12 (non-iOS gate passed, #28; iOS verification deferred—not passed, #58).
- **Live backend deploy done (2026-11-12):** with owner approval, the one-time live `supabase db push --remote` applied all five Phase 4 migrations (profiles/weight/cycle, product catalog, grants + RLS + Storage policies, account-lifecycle RPCs, advisor hardening) to the live project `bloom-dev` (ref `llfxmbxxwzqvoyhuehdl`). Migrations only — the dev seed/fixtures were not pushed. The remote schema now matches the locally verified one (clean advisors, 71 pgTAP). Operational note: this Supabase CLI defaults `db push` to the local stack, so `--remote` is required to target the cloud project.
- Phase 7 plan (milestone 8): schema prerequisite [#107](https://github.com/Csamuels1/BLOOM/issues/107) (meals += macros + slot) → then [#29 Nigerian](https://github.com/Csamuels1/BLOOM/issues/29) + [#30 US](https://github.com/Csamuels1/BLOOM/issues/30) catalogs in parallel → [#31 filtering/swaps](https://github.com/Csamuels1/BLOOM/issues/31) + [#32 calculator](https://github.com/Csamuels1/BLOOM/issues/32) → [#33 dietitian review + gate](https://github.com/Csamuels1/BLOOM/issues/33). Owner choice: catalog content is built as clearly-marked DRAFT (unreviewed/inactive) scaffolding; real nutritional sourcing + qualified dietitian review happen at #33 before anything activates (AGENTS.md — health content requires qualified review).

Issue #107 progress (2026-11-13): Phase 7 schema prerequisite. Migration `20261113114558_meals_macros_slot.sql` adds `protein_g`, `carbs_g`, `fat_g` (non-negative grams) and `slot` (breakfast/lunch/dinner/snack) to `public.meals`, plus a `(region, slot)` index for recommendation filtering. Columns are nullable so catalog rows seed as drafts and macros are confirmed during dietitian review. New pgTAP `0007_meals_macros_slot.test.sql` covers the columns + constraints; **77 pgTAP pass** on a clean reset, advisors stay clean, and `src/types/database.ts` regenerated. Verified: `npm run verify` green (235 Jest + 27 toolchain).

Issue #28 progress (2026-11-12): the Phase 6 exit gate. All Phase 6 issues complete (#25 weight CRUD, #26 weekly-average chart, #27 private photos — #25/#27 built in parallel per ADR-0009, #26 after #25). Full tier green on a clean run: `npm run verify` (**235 Jest** + 27 toolchain, type-check, lint, format, dependency audit), **expo-doctor 21/21**, **all-platform `expo export`** (android/ios/web + server render, 25 routes, exit 0 — both platform bundles build). Backend: **71 pgTAP tests** pass on the local stack, including a new `0006_storage_privacy.test.sql` that verifies **two-user privacy for progress photos** — a user may write and read only under their own `{uid}/` prefix and can neither write into nor read another user's space. Accessibility (non-iOS): the progress chart is decorative with a matching in-words summary; loading announces via a `progressbar` region; errors via polite live regions; weight form inputs are labeled and never cleared on failure; motion is reduce-motion-aware. iOS runtime/device interaction, VoiceOver, and the image-picker media flow on-device are deferred—not passed, recorded in [#58](https://github.com/Csamuels1/BLOOM/issues/58) per ADR-0006.

## Phase 6 (closed 2026-11-12)

- Delivery note: first run of the parallel-delivery model (ADR-0009). Workers built #25 and #27 in parallel (independent domains); the supervisor integrated each with route/Today/doc wiring and re-verified. #26 (chart) depended on #25; #28 was the gate.
- Done: [#25 weight log CRUD + unit conversion](https://github.com/Csamuels1/BLOOM/issues/25) (PR #100), [#27 private progress photos](https://github.com/Csamuels1/BLOOM/issues/27) (PR #101) — built in parallel (Wave 1); [#26 progress chart](https://github.com/Csamuels1/BLOOM/issues/26) (Wave 2, depends on #25). Next: the [#28 exit gate](https://github.com/Csamuels1/BLOOM/issues/28).

Issue #26 progress (2026-11-12): weekly-average progress chart + gentle milestones. New `src/features/progress`: pure, timezone-free math (`weeklyAverages.ts` — groups entries into **weekly averages so daily spikes are never plotted**; `summarizeTrend` describes direction neutrally with a steady band so ordinary fluctuation isn't a trend), `milestones.ts` (recognizes **distinct weeks of showing up — gaps never remove a milestone; no streaks, no weight-reached**), a decorative `ProgressChart` (react-native-svg weekly line, hidden from assistive tech) paired with a matching `ProgressSummary` in words (**the accessible summary conveys the same data as the chart**), and `ProgressScreen` composing them over the #25 weight store with gentle loading/empty/error states + retry. Reached from the Today "bigger picture" card (new `src/app/(app)/progress.tsx` route). Voice: loss/gain/maintenance equal; no verdicts. Built sequentially (Wave 2) since it depends on #25's data. Verified: `npm run verify` green from the main checkout.

Issue #27 progress (2026-11-12): private, optional progress photos. New `src/features/photos`: a typed Storage service (`photoService.ts`) where **every object path is `{userId}/{name}`** (matching the `progress_photos_rw_own` RLS policy — ownership enforced on both client and server), the private bucket is read only through short-lived **signed URLs** (never public), and `replacePhoto` rolls back on failure; a Zustand store; and `ProgressPhotosScreen` (optional picker via `expo-image-picker`, grid display, replace/delete with gentle confirm). Selection is optional — the empty state is a warm invitation, never a prompt. Voice/safety: photos are framed as **private personal keepsakes with no before/after or comparison framing**. Added dependency `expo-image-picker@57.0.21` (pinned, via `expo install`). Reached from a Today-screen entry (new `src/app/(app)/progress-photos.tsx` route). Built by a worker agent in parallel with #25; integrated by the supervisor. Verified: `npm run verify` + `expo-doctor` 21/21 green from the main checkout. The two-user privacy E2E (user A cannot touch user B's objects) is enforced by Storage RLS and will be exercised against the local/live stack at the #28 gate.

Issue #25 progress (2026-11-12): weight log CRUD + unit conversion. New `src/features/weight`: pure kg↔lb conversion (`units.ts` — **kilograms are canonical and the only stored magnitude**; imperial is display-only), typed CRUD service (`weightService.ts` — discriminated results, `user_id` forced from auth, RLS owner-scoped, multiple entries per `measured_at` DATE allowed, no timezone math), a Zustand store with a gentle error state, and an accessible add/edit/delete screen + form. **Failures do not discard input** — the form owns its text state, and a failed save keeps the values with a retryable notice. Reached from the Today screen's "Log a weight" quick action (new `src/app/(app)/weight-log.tsx` route). Voice: weight is neutral data — no shame, comparison, or body-transformation language. Built by a worker agent in parallel with #27; integrated by the supervisor. Verified: `npm run verify` green from the main checkout.

Issue #24 progress (2026-11-12): the Phase 5 exit gate. All Phase 5 issues are complete ([#22](https://github.com/Csamuels1/BLOOM/issues/22) Today screen, [#23](https://github.com/Csamuels1/BLOOM/issues/23) resilient states + Free/Pro affordances). Full verification tier green on a clean run: `npm run verify` (**164 Jest** + 27 toolchain, type-check, lint, format, dependency audit), **expo-doctor 21/21**, and an **all-platform `expo export`** (android/ios/web + server render, 19 routes, exit 0 — platform layouts build). Accessibility acceptance (non-iOS): headers expose `role="header"`; all controls are labeled buttons meeting the 48dp touch target; the expandable meal cards expose `accessibilityState.expanded` with a hint; loading announces via a `progressbar` region, and the error/coming-soon notices via polite live regions; skeletons are hidden from assistive tech; all motion (entrance, chevron, skeleton pulse) is suppressed under reduce-motion; text honors dynamic type up to the capped multiplier. iOS runtime/device interaction and VoiceOver acceptance are deferred—not passed, recorded in [#58](https://github.com/Csamuels1/BLOOM/issues/58) per ADR-0006.

## Phase 5 (closed 2026-11-12)

- Done: [#22 Today screen with mock meals](https://github.com/Csamuels1/BLOOM/issues/22) (PR #95), [#23 loading/empty/error + Free/Pro affordances](https://github.com/Csamuels1/BLOOM/issues/23) (PR #98), [#24 exit gate](https://github.com/Csamuels1/BLOOM/issues/24).

Issue #23 progress (2026-11-12): made the Home screen resilient and clear. Three reusable design-system state components — `Skeleton`, `EmptyState`, `ErrorState` (gentle, accessible; ordinary errors never use the safety-reserved amber) — plus a `MealCardSkeleton`. The Today meals area now reflects the profile load: **skeletons while loading, a calm setup nudge (EmptyState) when onboarding is unfinished, and a retryable error (ErrorState) when the load fails** — and in every state the mock ideas still render (general fallback) so **no initiated action or content is lost**. The profile store gained an `error` status and a safe retry (`loadProfile` now throws on a real query error; the store catches and surfaces it; the home passes an `onRetryProfile`). A lightweight `src/features/subscription` (presentation-only; real entitlements are Phase 10) adds a tier placeholder and a **pressure-free Pro affordance** — Free allowances are labeled clearly and Pro is an open door that is honest it is not purchasable yet. New copy is covered by the prohibited-language test. Verified: `npm run verify` green (**164 Jest** + 27 toolchain).

Issue #22 progress (2026-11-12): the branded **Today** screen — the daily overview shown before real recommendations exist. New `src/features/today`: a typed mock meal catalog (`mockMeals.ts`, region-aware via the profile's `country_code` — Nigerian vs general), an expandable `MealCard` (tap to reveal ingredients + a quick "note this meal" action), a reduce-motion-aware entrance (`FadeInView`), and `TodayScreen` composing a header, a gentle "bigger picture" trend card (an honest empty-state baseline — no fabricated data), a quick-log entry point (logging itself is Phase 6, so it shows an honest "coming soon" note rather than a fake result), and three meal ideas. Voice/safety: the dish leads, **calories are a small secondary approximate range — never the headline — and day-to-day weight changes are explicitly framed as not the story** (weeks, not days). The home route now leads with the Today overview and keeps the #20 account actions (export/delete/sign out) in a de-emphasized section below. All motion is core `Animated` + `LayoutAnimation`, suppressed under reduce-motion (no new dependencies). New copy is covered by the prohibited-language test. Verified: `npm run verify` green (**150 Jest** + 27 toolchain), expo-doctor 21/21, web export builds.

## Phase 4 (closed 2026-11-11)

- Phase 3 closed on 2026-11-10 (iOS verification deferred—not passed, #58).
- Done: [#17 profile schema](https://github.com/Csamuels1/BLOOM/issues/17) (PR #82), [#18 product schema](https://github.com/Csamuels1/BLOOM/issues/18) (PR #83), [#19 RLS + Storage policies](https://github.com/Csamuels1/BLOOM/issues/19) (PR #84), [#20 onboarding persistence + export/deletion](https://github.com/Csamuels1/BLOOM/issues/20) (PR #85), [#21 database exit gate](https://github.com/Csamuels1/BLOOM/issues/21).
- Pending owner approval: the one-time live `supabase db push` of the Phase 4 migrations to the cloud project (a backend deploy, AGENTS.md). All verification below is on a clean **local** reconstruction; nothing is applied to the live project yet.

Issue #21 progress (2026-11-11): the Phase 4 database exit gate — proving the backend can be rebuilt and safely accessed. A deterministic `supabase/seed.sql` was added (development catalog fixtures — meals and support resources, all seeded as unreviewed drafts / not active / not verified so no content is served as approved, per AGENTS.md). Verified on a clean `supabase db reset`: all five migrations replay and the seed loads; regenerated types are byte-identical to the committed `src/types/database.ts` (modulo Prettier); **67 pgTAP tests pass** (`npm run test:db`). Ran the security + performance advisors against the reconstructed schema and resolved two findings in migration `20261111155704_phase4_advisor_hardening.sql`: pinned `search_path = ''` on `is_moderator` and `set_updated_at` (`function_search_path_mutable`), and added covering indexes for the `reviewed_by`/`moderator_id` foreign keys (`unindexed_foreign_keys`); RLS-is-enabled and `(select auth.*())` initplan advisors were already clean. New pgTAP suite `0005_advisors.test.sql` encodes all five advisor invariants as catalog assertions so a later migration cannot silently regress them. Full `npm run verify` green (typecheck, lint, format, **141 Jest**, 27 toolchain, dependency audit).

Issue #20 progress (2026-11-11): onboarding persistence and account lifecycle — the first real backend writes. Migration `20261111135613_account_lifecycle_and_onboarding_persistence.sql` adds three authenticated RPCs: `persist_onboarding(jsonb)` (security invoker, atomic upsert of the caller's profile, identity forced to `auth.uid()`, canonical cm), `export_current_user()` (own-data JSON), and `delete_current_user()` (SECURITY DEFINER, scoped to `auth.uid()`, deletes the auth user → cascades to all owned rows and invalidates sessions). The Supabase client is now typed (`SupabaseClient<Database>`); `src/features/profile` wraps the RPCs (persist/load/export/delete). `PreviewStep` persists the draft on finish then clears the local draft; the home screen gains authenticated Export and Delete (with confirmation) actions. Storage cleanup on deletion runs client-side via the Storage API (direct SQL deletes are blocked by a Storage trigger). Verified: **62 pgTAP tests** (incl. persist round-trip, export scoping, delete cascade) and **141 Jest tests** (mapping, service, finish-persists flow) pass; all-platform export + expo-doctor 21/21 green.

Issue #19 progress (2026-11-11): grants, operation-specific RLS policies, and private Storage policies (migration `20261111081446_rls_grants_storage_policies.sql`). A `public.is_moderator()` helper reads the role from immutable `app_metadata` (never user-editable fields). Private per-user tables (profiles, weight, cycle) are owner-only on every operation; catalogs (meals, support_resources) expose only approved/verified rows to clients (staff see all; writes are service-role); subscriptions are read-own; community posts show approved-or-own-or-staff with blocked pairs hidden and authors limited to pending edits; reports hide the reporter from other users (reporter/staff only); moderation audit is staff-only and append-only; analytics events are insert-own and never client-readable. Two private Storage buckets (progress-photos, community-images) restrict objects to the owner by path prefix, with staff read for community images. Verified: the migration applies and **50 pgTAP tests pass** including an authorization matrix across owner/other-user/moderator roles (`npm run test:db`).

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
