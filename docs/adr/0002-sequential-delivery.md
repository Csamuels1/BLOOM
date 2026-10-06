# ADR-0002: Sequential Issue and Phase Delivery

- Status: Accepted
- Date: 2026-10-06

## Context

The product contains health-safety, privacy, community, billing, and store-release dependencies. Progress must remain visible and independently reviewable.

## Decision

Use GitHub issues, phase milestones, and one project board. Work on one phase at a time and close its exit gate before beginning the next phase. Use one issue branch and pull request per independently testable change.

Require explicit approval before each commit, each push, each merge, each production change, and each release action.

## Consequences

- The history remains auditable.
- Phase progress is slower but defects and scope changes are less likely to leak forward.
- External approvals appear as explicit blockers rather than silently deferred work.
