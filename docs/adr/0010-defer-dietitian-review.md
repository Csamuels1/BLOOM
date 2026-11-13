# ADR-0010: Defer Phase 7 Dietitian Review (Owner-Approved)

- Status: Accepted
- Date: 2026-11-13

## Context

Phase 7 delivers the meal catalogs (ADR-0004 regional strategy) and a
calorie-range plan calculator. AGENTS.md requires that health calculations and
content receive qualified review before production, and issue #33 is the gate
that obtains a dietitian's sign-off on both catalogs and the calculator formula.

A qualified dietitian is not available at this stage of the build. The owner has
decided to continue building later phases so the application is feature-complete,
and to supply dietitian-approved data (validated macros, approved meals, and
confirmed formula inputs) once review is arranged. This mirrors the iOS
deferral in ADR-0006: an owner-approved, explicitly-recorded deferral rather
than a waiver.

## Decision

Proceed past Phase 7 with the meal catalogs and the calculator formula as
**unreviewed drafts**, under these conditions:

- Every catalog meal stays `review_status = 'in_review'` and `is_active = false`.
  A database invariant test asserts **zero approved/active meals**, so nothing
  unreviewed can ever be served, and the recommendation engine (which selects
  only from approved/active candidates in production) returns nothing until
  review completes.
- The calculator output is a draft range stamped with `FORMULA_VERSION` /
  `CONTENT_VERSION`; it already refuses to generate targets during pregnancy and
  never emits a single prescriptive figure.
- Issue #33 (dietitian sign-off) remains **open and blocked**. Phase 7 is
  labeled "dietitian content review deferred — not passed," carried on #33.
- When the owner supplies dietitian-approved data, an **activation migration**
  updates the reviewed meals to `approved` / `active` (and records
  `reviewed_by` / `reviewed_at`), bumps the formula/content version if inputs
  changed, links the approval evidence safely (no PII in the repo), and then
  #33 is completed and closed.

This deferral covers content and formula review only. All engineering gates
(migrations from a clean reset, pgTAP, advisors, `verify`, `expo-doctor`,
all-platform export) still apply and must pass.

## Consequences

- The app is feature-complete through Phase 7 and later phases can proceed, but
  real meal recommendations and calorie ranges are **not served as approved**
  until qualified review lands — by design, this is the safe default.
- The draft catalogs and formula live in the codebase (and the live DB as
  inactive drafts) with honest provenance, auditable and ready to activate.
- Safety is preserved by construction: the zero-active-meals invariant makes it
  impossible to serve unreviewed content, and pregnancy never receives targets.
- The outstanding review is visible and tracked on #33, not silently skipped.
