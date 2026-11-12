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

## Parallel delivery within a phase

Delivery stays within one phase at a time, but independent issues of the current phase may be built in parallel to improve throughput. See ADR-0009.

- **Roles.** A **supervisor** (the coordinating session) owns the phase; **worker** subagents each take one issue in their own branch and git worktree; the **owner** approves batch plans, change sets, and all merges and deploys.
- **What may run in parallel.** Only issues that share no dependency and no files. Dependent issues are serialized by their dependency order. No issue is parallelized across the phase exit gate; the exit gate runs last and alone.
- **Worker scope.** Workers implement their issue to every standard in this document and run the required verification tier, then report a diff summary and test results. Workers never push, open pull requests, or merge.
- **Integration.** The supervisor reviews each worker's diff, resolves any cross-branch conflict, and re-runs full verification on the combined change set (issues that pass alone can still break together) before presenting consolidated change sets for approval.
- **Unchanged guarantees.** Branch-per-issue, pull-request-per-issue, one commit per issue, and every test, review, and documentation gate still apply. Merges remain sequential and owner-approved; backend deploys and releases remain separately approved.

## Approval checkpoints

- **Change-set gate.** Before committing, show the exact changed files, a concise diff summary, and the result of the required verification tier. One explicit approval at this gate authorizes commit, push, and opening the pull request together.
- **Standing approval (optional).** The owner may grant standing change-set approval for a session or a phase. It covers commit, push, and opening pull requests only; it never covers merge, deploy, or release.
- **Separate approvals.** Merging a pull request, deploying a backend change (including `supabase db push`), tagging a release, submitting a store build, or changing production data each requires its own explicit approval. These are the irreversible, outward-facing steps.
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

## Verification tiers

Run the checks that apply to the change, so effort matches risk without weakening any gate.

- **Every change** must pass `npm run verify` (type-check, lint, format, Jest, toolchain tests, dependency-audit gate) locally before the change-set gate, and `application-checks` green in CI before merge.
- **Native, app-config, or dependency changes** additionally require `expo-doctor` and an all-platform `expo export`. These are also required at every phase exit gate, and are not required for pure application-logic or copy changes.
- **Database changes** (migrations, policies, functions) additionally require a clean `supabase db reset`, `supabase test db` (pgTAP), a generated-type match against `src/types/database.ts`, and clean database advisors.
- **Phase exit gates** run the full set regardless of tier.

## Definition of done

An issue is complete only when its acceptance criteria, automated tests, manual checks, documentation, accessibility impact, privacy impact, and security impact have been addressed. A phase is complete only when every issue is done and its phase-gate checklist passes.
