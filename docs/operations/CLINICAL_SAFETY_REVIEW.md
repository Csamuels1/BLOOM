# Clinical safety review: sign-off checklist

> **Status: NOT SIGNED OFF.** Clinical sign-off is deferred by
> [ADR-0013](../adr/0013-defer-clinical-safety-signoff.md) and tracked on #50.
> The guardrails below are **active on conservative defaults** while they wait
> for review. This is not a waiver: no control is relaxed.

Prepared for: a qualified clinician (registered dietitian and/or an eating-disorder
and perinatal-mental-health specialist) reviewing BLOOM's safety behaviour before
real users. Each item lists exactly what runs (its version, where it lives, and
how it is tested) so the review covers the shipped behaviour and nothing else.

## How to review

For each item: confirm the value or wording is appropriate for postpartum and
weight-concerned users, or state a change. Approved changes are made with a
**version bump**, so every saved plan or evaluation records which reviewed values
produced it. Record the outcome in the sign-off table at the end.

## 1. Calorie floor and loss pace (#47)

| Item                                     | Current value            | Version                              | Code                                | Tests                                                              |
| ---------------------------------------- | ------------------------ | ------------------------------------ | ----------------------------------- | ------------------------------------------------------------------ |
| Calorie floor (no plan suggests below)   | 1200 kcal/day            | `GUARDRAIL_VERSION` `safety-2026.11` | `src/features/safety/guardrails.ts` | `tests/safety/guardrails.test.ts` (fuzz + bypass)                  |
| Loss-pace ceiling (faster is redirected) | 1 kg/week                | `safety-2026.11`                     | `src/features/safety/guardrails.ts` | `tests/safety/guardrails.test.ts`                                  |
| Floor applied to every plan range        | always, only ever raises | `safety-2026.11`                     | `src/features/plan/calculator.ts`   | `tests/safety/guardrails.test.ts`, `tests/plan/calculator.test.ts` |

Questions for the reviewer: Is 1200 kcal the right floor for this population,
including breastfeeding, or should it be higher or context-dependent? Is 1 kg/week
right for the postpartum period, or should it be lower?

## 2. Plan formula and feeding adjustments (#32, #35)

Also covered by the dietitian review (#33, ADR-0010).

| Item                                    | Version                               | Code                                            |
| --------------------------------------- | ------------------------------------- | ----------------------------------------------- |
| Base calorie ranges by goal             | `FORMULA_VERSION` `draft-2026.11`     | `src/features/plan/calculator.ts`               |
| Breastfeeding / mixed-feeding allowance | `draft-2026.11`                       | `src/features/plan/calculator.ts`               |
| Postpartum feeding adjustments          | `ADJUSTMENTS_VERSION` `draft-2026.11` | `src/features/postpartum/feedingAdjustments.ts` |
| Pregnancy: no targets ever generated    | n/a (hard stop)                       | `src/features/plan/calculator.ts`               |

## 3. Concerning-pattern thresholds (#48)

| Item                        | Current value                  | Version           | Code                                                          | Tests                                         |
| --------------------------- | ------------------------------ | ----------------- | ------------------------------------------------------------- | --------------------------------------------- |
| Lookback window             | 28 days                        | `signals-2026.11` | `supabase/migrations/20261119090000_safety_signal_engine.sql` | `supabase/tests/0015_safety_signals.test.sql` |
| Minimum data to evaluate    | ≥ 3 entries spanning ≥ 14 days | `signals-2026.11` | same                                                          | same (missing-data, short-span)               |
| Rapid sustained loss signal | > 1 kg/week over the span      | `signals-2026.11` | same                                                          | same (threshold)                              |

Guarantees that hold whatever the values are: evaluation is server-side,
reads only the user's own data, triggers only on complete data, and returns
non-diagnostic codes only (no `diagnosis` is ever emitted).

Questions for the reviewer: Are the window, completeness rule, and threshold
appropriate? Should other patterns be added, such as intake-based checks once
intake logging exists?

## 4. Messages and wording (#47, #48, #49)

| Item                                       | Version                                  | Code                                         | Tests                                 |
| ------------------------------------------ | ---------------------------------------- | -------------------------------------------- | ------------------------------------- |
| Guardrail copy (floor, pace redirect)      | `CONTENT_VERSION` (plan) / reviewed copy | `src/content/safety.ts`                      | `tests/copy.test.ts`                  |
| Gentle check-in wording                    | reviewed copy                            | `src/content/safety.ts` (`signalRapidLoss*`) | `tests/safety/safety-signals.test.ts` |
| Support screen, fallback, emergency notice | reviewed copy                            | `src/content/support.ts`                     | `tests/support/support-ui.test.tsx`   |
| Postpartum context narratives              | `CONTENT_VERSION` `draft-2026.11`        | `src/features/postpartum/context.ts`         | postpartum suites                     |

Questions for the reviewer: Is the wording non-diagnostic, non-shaming, and
appropriate if someone is struggling? Is the emergency guidance correct?

## 5. Support resources (#49)

No real resources are active yet; seeded rows are inactive placeholders.

| Item                                                | Rule                 | Code                                                                   | Tests                                                     |
| --------------------------------------------------- | -------------------- | ---------------------------------------------------------------------- | --------------------------------------------------------- |
| Resources shown only when active + verified + dated | DB constraints + RLS | `supabase/migrations/20261119100000_support_resources_review_date.sql` | `supabase/tests/0016_support_resource_freshness.test.sql` |
| Crisis help first; per-release reverification       | process              | [SUPPORT_RESOURCES.md](SUPPORT_RESOURCES.md)                           | `tests/support/resources-service.test.ts`                 |

Action for the reviewer: approve the specific regional resources (Nigeria,
United States, global) to be verified and activated.

## Sign-off record

| Section                    | Outcome (approved / changes) | Reviewer role | Date | Evidence reference |
| -------------------------- | ---------------------------- | ------------- | ---- | ------------------ |
| 1. Floor and pace          |                              |               |      |                    |
| 2. Formula and adjustments |                              |               |      |                    |
| 3. Pattern thresholds      |                              |               |      |                    |
| 4. Messages                |                              |               |      |                    |
| 5. Resources               |                              |               |      |                    |

Store evidence outside the repo with no personal data, and reference it here by
document id. Once every row is approved, apply any version bumps, activate the
approved resources, update BUILD_STATUS, and close #50.
