# AGENTS.md

These instructions apply to the entire repository.

## Product principles

- BLOOM serves postpartum women first and supports loss, gain, and maintenance as equal goals.
- Protect physical and emotional safety over engagement, speed, or monetization.
- Never use shame, punishment, fear, or body-transformation language.
- Never diagnose. Health calculations, content, safety thresholds, and support resources require qualified review before production.
- Do not infer low intake from missing logs.
- Do not collect precise location. Use device locale or a user-selected country/region.

## Sequential delivery

- Work through the milestones in `docs/BUILD_STATUS.md` in order.
- Work on only one phase at a time.
- Do not start the next phase until the current phase exit gate is complete and tested.
- Owner-approved exception (2026-10-07): iOS-specific verification, builds, and fixes from Phases 1–12 are deferred to Phase 13, not waived or passed. Before closing each earlier gate, record its deferred iOS acceptance in issue #58 and label the phase "iOS verification deferred—not passed." All non-iOS gates still apply. Restore automatic iOS checks and complete the accumulated acceptance before closing Phase 13. See ADR-0006.
- Every change must map to a GitHub issue with acceptance criteria, tests, dependencies, and documentation impact.
- Use one branch per issue: `type/issue-N-short-description`.
- Open pull requests against `main` and include `Closes #N`.
- The empty-repository bootstrap is the sole exception: issue #1 may create the first `main` commit because no base branch exists for a pull request. All later issues require an issue branch and pull request.

## Approval checkpoints

- Before every commit, show the user the exact changed files, a concise diff summary, and test results, then ask for explicit permission.
- After committing, show the commit hash and ask separately for permission before pushing.
- Do not merge a pull request, tag a release, deploy a backend change, submit a store build, or change production data without separate explicit approval.
- Do not combine unrelated issue work in one commit or pull request.
- Do not carry unrelated uncommitted changes into another issue.

## Engineering standards

- Use strict TypeScript. Do not use `any` to bypass a type problem.
- Pin dependency versions and commit the package lockfile.
- Use Expo-compatible installation commands for native dependencies.
- Keep user-facing, voice-sensitive copy centralized and covered by prohibited-language tests.
- Support screen readers, dynamic text, reduced motion, keyboard navigation, and accessible touch targets.
- Never place secrets in source, tracked environment files, client bundles, logs, analytics, or issue/PR text.
- Never expose Supabase service-role keys, RevenueCat secrets, store credentials, or crash-reporting secrets to a client.

## Supabase standards

- Verify current Supabase documentation and breaking changes before implementation.
- Manage schema changes through versioned migrations and verify them from a clean local reset.
- Enable RLS on every table in an exposed schema and test both allowed and denied operations.
- Use operation-specific policies with ownership checks. `TO authenticated` alone is not authorization.
- Use immutable `app_metadata` for staff roles; never authorize from user-editable metadata.
- Prefer `security invoker`; treat every `security definer` function as a security review item.
- Store privileged functions outside exposed schemas, revoke default execution where appropriate, and run database advisors.

## Definition of done

An issue is complete only when its acceptance criteria, automated tests, manual checks, documentation, accessibility impact, privacy impact, and security impact have been addressed. A phase is complete only when every issue is done and its phase-gate checklist passes.
