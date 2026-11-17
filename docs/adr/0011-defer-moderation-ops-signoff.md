# ADR-0011: Defer Moderation-Operations Sign-Off (Owner-Approved)

- Status: Accepted
- Date: 2026-11-18

## Context

Phase 9 (#42) requires that community moderation have real operational ownership
before the community is used: approved community rules, a staffing and response
procedure, an escalation path, and a tabletop sign-off. These are human and
organisational commitments (trained moderators, coverage hours, a clinically
reviewed crisis path), not code.

At this stage of the build, staffing is not yet in place and a qualified
reviewer for the crisis/safeguarding path is not yet available — the same
constraint as the Phase 7 dietitian review (ADR-0010). The owner has decided to
**draft** the operations now so the engineering is complete and the content is
ready to approve, and to obtain sign-off when staffing and a reviewer are
arranged, rather than block the build. This mirrors ADR-0006 (iOS) and ADR-0010
(dietitian): an owner-approved, explicitly recorded deferral, not a waiver.

## Decision

Complete Phase 9 engineering and pass the engineering exit gate with the
moderation operations as an **unapproved draft**
([docs/operations/MODERATION_OPERATIONS.md](../operations/MODERATION_OPERATIONS.md)),
under these conditions:

- The community stays **closed to real users** until the document is approved.
  This is enforced **by construction**, not by policy: posting and reactions
  require an active Pro subscription (server-enforced, #119), and no account can
  be Pro until RevenueCat lands in Phase 10. Approval is a **precondition** for
  opening the community, not a side effect.
- The draft carries a visible DRAFT banner and an explicit sign-off checklist
  (owner approval of rules + escalation, a qualified reviewer for the crisis
  path, confirmed staffing of at least two trained moderators and a named
  escalation lead, a recorded tabletop run).
- Issue #42's operational acceptance criteria — "staffing and response procedure
  exist" and "rules and escalation are approved" — are met as **drafted and
  deferred**, tracked openly, not silently skipped. The security and engineering
  acceptance ("all community security tests pass") is **not** deferred and must
  pass at the gate.
- When staffing and a reviewer are in place, the tabletop is run, the crisis path
  is reviewed, the sign-off is recorded in the document and BUILD_STATUS, and the
  DRAFT banner is removed. Only then may the community be opened (alongside the
  Phase 10 Pro gating).

This deferral covers **operational sign-off only**. All engineering gates
(migrations from a clean reset, pgTAP including the community security and
escalation suites, advisors, `verify`, `expo-doctor`, all-platform export) still
apply and must pass for Phase 9 to close.

## Consequences

- Phase 9 is feature- and security-complete: server-enforced Pro gating, blocks,
  reporter privacy, audited moderation, pending media, and a web-only staff queue
  — proven by pgTAP 0011 and 0012 — while the human operations are drafted and
  ready for approval.
- The community cannot be used by real members until sign-off, by construction,
  so no unmoderated real-user community can exist.
- The outstanding sign-off is visible and tracked on #42 (and in BUILD_STATUS),
  with a concrete checklist, rather than being an implicit gap.
- Risk accepted: the drafted rules, escalation path, and crisis signposting are
  not yet reviewed by a qualified person; they must not be used for real-user
  decisions until that review and the rest of the checklist are complete.
