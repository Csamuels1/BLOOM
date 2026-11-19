# ADR-0013: Defer Phase 11 Clinical Safety Sign-Off, Guardrails Active (Owner-Approved)

- Status: Accepted
- Date: 2026-11-19

## Context

Phase 11 delivers BLOOM's safety guardrails: a calorie floor and loss-pace
ceiling (#47), a versioned server-side concerning-pattern engine (#48), and
always-reachable support with gentle check-ins (#49). Issue #50 is the gate that
obtains **qualified clinical sign-off** of the formula adjustments, thresholds,
messages, and resources, and its criteria state that "no waiver exists."

A qualified clinician is not available at this stage, the same constraint as the
dietitian review (ADR-0010). The owner has decided to close the Phase 11
**engineering** gate now and obtain clinical sign-off when a clinician is
arranged.

The distinction from earlier deferrals matters here. Deferring the dietitian
review kept meals _inactive_, because unreviewed food content is the risk.
For guardrails, the protective behaviour **is** the safe state, so the
guardrails stay **on**. What waits is a qualified person validating the specific
values and wording.

## Decision

Close the Phase 11 engineering gate with clinical sign-off deferred, on these
terms:

- **The guardrails stay active on conservative defaults.** The 1200 kcal floor
  and the 1 kg/week ceiling are enforced in computation and can't be bypassed.
  The concerning-pattern engine runs server-side, triggers only on complete
  data, and emits non-diagnostic codes. Support stays reachable with an
  always-present fallback. Nothing is turned off and no riskier behaviour ships.
- **This is not a waiver**, which is what #50's "no waiver exists" guards
  against. No safety control is relaxed, disabled, or bypassed to close the
  phase. What waits is validation of the values, not the controls.
- **Unreviewed content stays inactive.** No real support resource is active until
  a clinician approves it: the database requires active resources to be verified
  and dated, and the seeded rows are inactive placeholders. Meals stay inactive
  under ADR-0010.
- **Every reviewable item is versioned and listed** in
  [CLINICAL_SAFETY_REVIEW.md](../operations/CLINICAL_SAFETY_REVIEW.md) with its
  version, its location in code, and its tests, so the clinician reviews exactly
  what runs.
- **#50 stays open and blocked** as the tracker, as #33 does. Phase 11 is
  labeled "clinical sign-off deferred — not passed."
- **When a clinician signs off**, any changed values get a bumped version, real
  resources are verified and activated, the sign-off is recorded with its
  evidence (no personal data in the repo), and #50 is completed and closed.

All engineering gates still apply and must pass: migrations from a clean reset,
pgTAP, advisors, `verify`, `expo-doctor`, and the all-platform export.

## Consequences

- BLOOM is protected by active guardrails now, so the safe defaults are what a
  user meets.
- The specific values and wording are not yet clinically validated. They are
  conservative and versioned, so a clinician can tighten or adjust them through a
  version bump, with no redesign.
- Pro and the community are still not open to real users (ADR-0011, ADR-0012),
  which limits exposure until sign-off.
- The outstanding sign-off is tracked openly on #50 with a concrete checklist,
  not silently skipped.
