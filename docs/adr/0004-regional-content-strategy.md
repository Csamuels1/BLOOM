# ADR-0004: Regional Content and Recommendation Strategy

- Status: Accepted
- Date: 2026-10-06

## Context

The first release needs culturally relevant meals and support resources for Nigeria and the United States without depending on inconsistent third-party regional coverage.

## Decision

Maintain a curated, versioned Supabase seed catalog with nutrition sources, ingredients, allergen metadata, meal slots, region, dietary tags, and goal suitability. Include enough approved content for a seven-day plan and at least two valid swaps per meal slot without immediate repetition.

Use deterministic recommendation logic with an auditable formula/content version. Require dietitian review before production. Store support resources by region with source and verification date, and re-verify them for every release.

## Consequences

- Content quality and sourcing become repository-tracked work.
- The product can explain why a meal was selected and reproduce a plan version.
- Adding another region requires content, safety-resource, clinical, and legal review rather than only a locale flag.
