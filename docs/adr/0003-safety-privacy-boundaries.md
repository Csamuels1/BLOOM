# ADR-0003: Safety and Privacy Boundaries

- Status: Accepted
- Date: 2026-10-06

## Context

BLOOM processes health-adjacent, body, cycle, postpartum, food, image, and community data. Its audience may be vulnerable to shame-based or unsafe weight guidance.

## Decision

- Restrict MVP use to adults.
- Do not provide pregnancy weight-target plans.
- Require qualified approval for formulas, meal content, safety thresholds, support resources, and health copy.
- Never infer low intake from absent logs.
- Never diagnose or represent the app as medical care.
- Collect country/region, not precise location.
- Keep progress photos private and community images private until approved.
- Use RLS and server-side entitlement enforcement.
- Keep analytics allowlisted and free of health, identity, text, photo, and precise-location data.

## Consequences

- Clinical and legal reviews are hard release gates.
- Recommendation and safety logic must be versioned and auditable.
- Some personalization is deliberately limited to protect users and reduce data collection.
