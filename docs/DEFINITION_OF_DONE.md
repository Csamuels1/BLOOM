# Definition of Done

## Issue completion

An issue is Done only when:

- Acceptance criteria are met.
- Required unit, component, integration, database, and E2E tests pass.
- Manual device checks are recorded where applicable.
- Loading, empty, error, offline, and permission-denied states are handled.
- Accessibility, privacy, security, safety, copy, analytics, and documentation impacts are addressed.
- No prohibited language or secret material was introduced.
- The pull request is reviewed and required CI passes.
- Commit, push, and merge approvals were obtained separately.

## Phase completion

A phase is Done only when:

- Every phase issue is Done.
- The phase-gate issue checklist passes.
- `docs/BUILD_STATUS.md` and relevant architecture records are current.
- Required product, brand, clinical, legal, security, content, or owner approvals are attached or linked.
- No unresolved blocker is moved silently to a later phase.
- The milestone is closed only after explicit approval.

## Store-ready MVP completion

The MVP is store-ready only when:

- Signed iOS and Android production artifacts install and pass smoke tests.
- Production migrations and server operations are verified.
- RevenueCat products and webhook behavior pass sandbox validation.
- Nigerian and US meal content and support resources are current and professionally reviewed.
- Clinical, legal, privacy, accessibility, security, moderation, and brand gates pass.
- Store metadata, screenshots, privacy declarations, account deletion, support details, and reviewer notes are complete.
- All P0 and P1 defects are resolved.
- Release notes and the final status document are complete.

App Store and Google Play review decisions are external and do not change whether the submitted package met the engineering release gate.
