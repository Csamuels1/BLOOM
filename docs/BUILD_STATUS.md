# BLOOM Build Status

This file is the repository-level view of the [BLOOM MVP project](https://github.com/users/Csamuels1/projects/1) and phase milestones. GitHub issues are the source of truth for individual deliverables.

## Status legend

- `[ ]` Not started
- `[~]` In progress
- `[x]` Complete and phase gate passed
- `[!]` Blocked by an explicit dependency

## Phase progress

- [~] Phase 0: Repository and Product Foundation
- [ ] Phase 1: Expo and Design-System Setup
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

## Current phase gate: Phase 0

- Completed bootstrap: [#1](https://github.com/Csamuels1/BLOOM/issues/1), delivered in commit `d9630e4`.
- Completed licensing decision: [#2](https://github.com/Csamuels1/BLOOM/issues/2), published through [PR #64](https://github.com/Csamuels1/BLOOM/pull/64). Continue without an open-source license for now; repository visibility remains public.
- Active exit gate: [#3 Pass the Phase 0 exit gate](https://github.com/Csamuels1/BLOOM/issues/3). Evidence is verified; this documentation update awaits commit, push, CI, and merge approval.

- [x] Repository foundation files reviewed
- [x] GitHub Project, labels, milestones, and issues created
- [x] Initial CI check passes
- [x] Initial commit explicitly approved
- [x] Initial push explicitly approved
- [x] `main` branch protection enabled after the first push
- [x] Phase 0 bootstrap review approved through the owner's initial commit and push approvals
- [ ] Exit-gate documentation PR passes CI and receives merge approval
- [ ] Phase 0 milestone closed

The next phase must not start until every Phase 0 item is complete.

## Verification evidence

Verified on 2026-10-07:

- [Repository checks passed on merged main](https://github.com/Csamuels1/BLOOM/actions/runs/37614548605), commit `c5d6b88`.
- Branch protection requires pull requests, an up-to-date branch, the `repository-policy` check, and resolved conversations. Protection applies to administrators; force pushes and branch deletion are disabled.
- GitHub does not require an additional approving reviewer for this single-owner repository. Explicit owner merge permission remains required by AGENTS.md.
- The project contains 62 issues across 15 milestones. All items have Phase, Workflow, Area, Platform, Priority, Release blocker, and Assignees populated. Assignees is the owner field.
- Issues #1 and #2 are complete. Issue #3 remains open until its documentation PR merges and the phase is closed.

After the approved gate PR merges, close issue #3 and milestone 1, then activate issue #4. The first Phase 1 change should update the phase checklist and README to reflect that transition; this historical verification record does not itself authorize Phase 1 work.

## Milestone and exit-gate index

| Phase | Milestone | Exit gate |
| --- | --- | --- |
| 0 | [Repository foundation](https://github.com/Csamuels1/BLOOM/milestone/1) | [#3](https://github.com/Csamuels1/BLOOM/issues/3) |
| 1 | [Expo and design system](https://github.com/Csamuels1/BLOOM/milestone/2) | [#7](https://github.com/Csamuels1/BLOOM/issues/7) |
| 2 | [Authentication](https://github.com/Csamuels1/BLOOM/milestone/3) | [#11](https://github.com/Csamuels1/BLOOM/issues/11) |
| 3 | [Onboarding](https://github.com/Csamuels1/BLOOM/milestone/4) | [#16](https://github.com/Csamuels1/BLOOM/issues/16) |
| 4 | [Schema and persistence](https://github.com/Csamuels1/BLOOM/milestone/5) | [#21](https://github.com/Csamuels1/BLOOM/issues/21) |
| 5 | [Home](https://github.com/Csamuels1/BLOOM/milestone/6) | [#24](https://github.com/Csamuels1/BLOOM/issues/24) |
| 6 | [Weight and progress](https://github.com/Csamuels1/BLOOM/milestone/7) | [#28](https://github.com/Csamuels1/BLOOM/issues/28) |
| 7 | [Meal recommendations](https://github.com/Csamuels1/BLOOM/milestone/8) | [#33](https://github.com/Csamuels1/BLOOM/issues/33) |
| 8 | [Cycle and postpartum](https://github.com/Csamuels1/BLOOM/milestone/9) | [#37](https://github.com/Csamuels1/BLOOM/issues/37) |
| 9 | [Community](https://github.com/Csamuels1/BLOOM/milestone/10) | [#42](https://github.com/Csamuels1/BLOOM/issues/42) |
| 10 | [Subscriptions](https://github.com/Csamuels1/BLOOM/milestone/11) | [#46](https://github.com/Csamuels1/BLOOM/issues/46) |
| 11 | [Safety](https://github.com/Csamuels1/BLOOM/milestone/12) | [#50](https://github.com/Csamuels1/BLOOM/issues/50) |
| 12 | [Polish](https://github.com/Csamuels1/BLOOM/milestone/13) | [#54](https://github.com/Csamuels1/BLOOM/issues/54) |
| 13 | [Release qualification](https://github.com/Csamuels1/BLOOM/milestone/14) | [#58](https://github.com/Csamuels1/BLOOM/issues/58) |
| 14 | [Store readiness](https://github.com/Csamuels1/BLOOM/milestone/15) | [#62](https://github.com/Csamuels1/BLOOM/issues/62) |

## External release gates

These gates cannot be waived for `v1.0.0`:

- Qualified clinician/dietitian approval of calculations, meal content, health copy, safety thresholds, and support resources
- Legal approval of privacy, terms, consumer-health-data handling, and store disclosures for Nigeria and the United States
- Owner approval of final brand assets
- Moderator staffing and response process
- Apple Developer, Google Play, Expo/EAS, Supabase, RevenueCat, and crash-reporting production access
