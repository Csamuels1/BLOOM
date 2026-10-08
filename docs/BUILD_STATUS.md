# BLOOM Build Status

This file is the repository-level view of the [BLOOM MVP project](https://github.com/users/Csamuels1/projects/1) and phase milestones. GitHub issues are the source of truth for individual deliverables.

## Status legend

- `[ ]` Not started
- `[~]` In progress
- `[x]` Complete and phase gate passed
- `[!]` Blocked by an explicit dependency

## Phase progress

- [x] Phase 0: Repository and Product Foundation
- [~] Phase 1: Expo and Design-System Setup
- [ ] Phase 2: Supabase Authentication
- [ ] Phase 3: Onboarding UI
- [ ] Phase 4: Supabase Schema and Profile Persistence
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

## Current phase: Phase 1

- Active: [#4 Expo foundation and EAS profiles](https://github.com/Csamuels1/BLOOM/issues/4).
- Next, sequentially: [#5 design system](https://github.com/Csamuels1/BLOOM/issues/5), [#6 approved brand assets](https://github.com/Csamuels1/BLOOM/issues/6), then [#7 exit gate](https://github.com/Csamuels1/BLOOM/issues/7).
- Issue #4 remains open until its non-iOS acceptance and review workflow are complete; iOS verification is deferred—not passed. See [development setup](DEVELOPMENT.md).
- Local scaffold verification: six app tests, type/lint/format checks, Expo compatibility/Doctor checks, all-platform exports, and Android Expo Go navigation passed. iOS runtime, browser interaction, signed builds, and the documented dependency-security review remain open. The initial Phase 1 checkpoint is published with approval; follow-up changes require new approval.
- Security follow-up: selector-parser and UUID fixes pass five consumer-level tests. Four root advisories remain; `dependency-audit` fails until resolved. All 14 tests and application/repository CI pass on [draft PR #66](https://github.com/Csamuels1/BLOOM/pull/66), most recently commit `6ded451`, published with owner approval. The iOS retry also timed out before app assertions; further iOS work is deferred to #58. Browser interaction remains unverified.

Issue #4 security follow-up (2026-10-08): the URI decoder fix is published in `4dd7873` with passing application/repository CI. A local scoped coverage YAML upgrade now removes sprintf-js and adds four consumer regression tests (23 total). Only braces and node-forge remain as root advisories; security CI remains blocked. The YAML upgrade awaits publication/CI; iOS remains deferred. No issue or phase has been closed by this work.

Latest issue #4 checkpoint: `77599b9` published the braces/node-forge mitigations and explicit navigation labels. Application CI passed all 29 tests, Doctor, and all-platform exports; repository policy passed. Limitations remain in [SECURITY_PATCHES.md](SECURITY_PATCHES.md): dependency audit still fails and security review is required; no waiver is approved. The subsequent Android cold-boot retry briefly recovered the welcome screen, but relaunch stalled at the splash screen, so current runtime/accessibility acceptance remains open. Browser discovery found no connected browser; iOS remains deferred. No issue or phase is closed.

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
