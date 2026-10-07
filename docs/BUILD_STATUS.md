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

## Current phase: Phase 1

- Active: [#4 Expo foundation and EAS profiles](https://github.com/Csamuels1/BLOOM/issues/4).
- Next, sequentially: [#5 design system](https://github.com/Csamuels1/BLOOM/issues/5), [#6 approved brand assets](https://github.com/Csamuels1/BLOOM/issues/6), then [#7 exit gate](https://github.com/Csamuels1/BLOOM/issues/7).
- Issue #4 remains open until its platform smoke tests and review workflow are complete. See [development setup](DEVELOPMENT.md).
- Local scaffold verification: six automated tests, type/lint/format checks, Expo compatibility/Doctor checks, all-platform exports, and Android Expo Go navigation passed. iOS runtime, browser interaction, signed builds, and the documented dependency-security review remain open. No Phase 1 commit or push has been approved yet.
- Security follow-up: selector-parser and UUID fixes pass five additional consumer-level tests. Four root advisories remain; the new CI `dependency-audit` job must fail until those findings are resolved. The owner has no Mac/iPhone; a GitHub-hosted iOS simulator workflow is prepared but has not run. Its selector adds three tests (14 total passing tests). Publishing and running the workflow awaits approval. Browser connection retry was also unavailable.

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
