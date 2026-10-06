# Store-Ready MVP Project Plan

This document records the approved implementation sequence. GitHub milestones and issues decompose each phase into independently testable work.

## Delivery rule

Phases are sequential. A phase is complete only after all linked issues, tests, documentation, review requirements, and its exit gate pass.

## Phase 0: Repository and Product Foundation

Establish repository governance, GitHub tracking, product and brand documentation, architecture records, environment policy, CI skeleton, dependency policy, and the approval workflow.

Because the repository begins with no commits or default branch, issue #1 creates the initial `main` commit as a one-time bootstrap exception. Branch-per-issue and pull-request enforcement begins immediately afterward.

**Exit gate:** Repository rules and tracking are operational, all later phases are represented by milestones and issues, initial CI passes, and the initial commit and push have separate approval.

## Phase 1: Expo and Design-System Setup

Scaffold the pinned Expo TypeScript application, Expo Router, NativeWind, Zustand, forms, icons, animation foundation, EAS profiles, design tokens, reusable UI, original brand assets, accessibility foundations, and application CI.

**Exit gate:** Clean installation, green CI, approved brand assets, and verified rendering on iOS and Android.

## Phase 2: Supabase Authentication

Set up local, staging, and production Supabase environments and implement adult eligibility, email/password registration, verification, sign-in, reset, sign-out, route protection, and persistent sessions.

**Exit gate:** Auth flows pass automated tests and device checks on iOS and Android.

## Phase 3: Onboarding UI

Build the seven-screen local onboarding flow, including goal, postpartum, pregnancy boundary, feeding context, basic stats, locale, units, allergens, dietary preferences, optional cycle tracking, and plan preview.

**Exit gate:** Every conditional path passes component and mobile E2E tests without backend writes.

## Phase 4: Supabase Schema and Profile Persistence

Create versioned migrations, RLS and Storage policies, generated types, onboarding persistence, account export/deletion foundations, and positive/negative authorization tests.

**Exit gate:** A fresh local reset succeeds, advisors and policy tests pass, and profiles save and reload correctly.

## Phase 5: Home with Mock Meals

Build the Today experience with typed mock meals, a trend placeholder, contextual insight, quick logs, free-tier states, and gentle empty/error handling.

**Exit gate:** Visual, component, and accessibility acceptance passes across representative devices.

## Phase 6: Weight Logging and Progress

Implement weight CRUD, unit conversion, weekly-average trends, optional private photos, gentle milestones, and resilient network handling.

**Exit gate:** Calculation, authorization, chart, media privacy, and E2E checks pass.

## Phase 7: Real Meal Recommendations

Build versioned Nigerian and US catalogs, ingredient/allergen data, deterministic recommendation and swaps, calorie ranges, formula auditing, and professional content review.

**Exit gate:** Catalog validation, regional and goal coverage, allergen exclusion, recommendation tests, and dietitian approval pass.

## Phase 8: Cycle and Postpartum Context

Implement optional cycle logs, expected-phase context, postpartum context, approved feeding adjustments, notifications, and private lock-screen defaults.

**Exit gate:** Date, time-zone, irregular-cycle, postpartum, permissions, and opt-out behavior pass.

## Phase 9: Community and Moderation

Implement two separate spaces, text and moderated-image posts, non-numeric support, reporting, blocking, moderation states, audit logs, and a protected web admin queue.

**Exit gate:** UGC abuse, authorization, privacy, moderation, and E2E checks pass and a staffed response process exists.

## Phase 10: RevenueCat Subscriptions

Implement the Pro entitlement, monthly and annual products, paywall, purchase/restore/account states, idempotent signed webhooks, and server-enforced access.

**Exit gate:** Sandbox purchases and entitlement transitions pass on both platforms without client-side bypasses.

## Phase 11: Safety Guardrails

Implement the 1,200-calorie loss floor, safe pace boundaries, versioned pattern checks, non-diagnostic messages, verified regional resources, and the full clinical approval gate.

**Exit gate:** Guardrail, bypass, and integration tests pass and qualified approval is recorded.

## Phase 12: Product Polish

Complete final art, motion, reduced motion, loading/empty/error states, settings, privacy controls, notifications, sanitized crash reporting, allowlisted analytics, and device resilience.

**Exit gate:** UX, accessibility, copy, privacy, and telemetry audits pass.

## Phase 13: Release Qualification

Run the complete automated and manual test matrix, device testing, security and dependency audits, usability studies, legal review, and defect closure.

**Exit gate:** Product, clinical, legal, security, accessibility, and content sign-offs produce an approved release candidate.

## Phase 14: Store-Ready Release

Produce signed iOS and Android builds, store metadata and screenshots, production validation, TestFlight/internal-track smoke tests, release notes, and submission packages.

**Exit gate:** Both artifacts and store packages pass the final checklist and are ready to submit; `v1.0.0` requires explicit approval.
