# ADR-0009: Parallel Delivery Within a Phase

- Status: Accepted
- Date: 2026-11-12

## Context

ADR-0002 established strictly sequential issue and phase delivery with an
explicit approval before each commit, push, and merge. That maximizes
auditability but makes throughput and latency a function of ceremony rather than
engineering: dependency chains must be sequential, but many phases also contain
issues that are genuinely independent, and those were still built one at a time.
The per-commit and per-push approvals added round-trips without adding safety,
and gate-level verification (expo-doctor, all-platform export) was being run on
every issue regardless of whether it touched native surfaces.

The owner asked to increase build speed while keeping accuracy, safety, tests,
review, and documentation intact.

## Decision

Keep one phase at a time, but allow **independent issues of the current phase**
to be built in parallel under a supervisor/worker model, and reduce low-value
ceremony without reducing gates:

- **Parallel delivery.** A supervisor (the coordinating session) partitions the
  current phase's issues by dependency and file overlap into waves. Issues that
  share no dependency and no files run in parallel, each handled by a worker
  subagent in its own branch and git worktree. Dependent issues remain
  serialized; no issue is parallelized across the phase exit gate, which runs
  last and alone. Workers implement and verify but never push, open pull
  requests, or merge. The supervisor integrates the diffs, re-runs full
  verification on the combined change set, and presents consolidated change sets
  for owner approval.
- **Change-set approval gate.** A single approval authorizes commit, push, and
  opening a pull request together. The owner may grant standing change-set
  approval for a session or phase. Merges, backend deploys, releases, and
  production-data changes each remain separately and explicitly approved.
- **Verification tiers.** `npm run verify` is the per-issue gate; expo-doctor and
  all-platform export are required for native/config/dependency changes and at
  phase gates; database changes additionally require a clean reset, pgTAP, a
  generated-type match, and clean advisors. Exit gates run the full set.

This ADR extends, and does not supersede, ADR-0002: sequential merges, one
branch and pull request per issue, one commit per issue, and all test, review,
and documentation requirements are unchanged.

## Consequences

- Throughput improves on phases with independent issues; dependency chains and
  exit gates see no change, by design.
- Running multiple worker subagents consumes more model capacity per phase; this
  is an accepted cost for parallel phases and is not used when a phase is a
  single dependency chain.
- Oversight concentrates at the two decisions that carry risk — what enters a
  change set and what merges or deploys — rather than at every intermediate
  step. History stays auditable: each issue keeps its own branch, pull request,
  and commit.
- Verification effort tracks risk; no gate is removed, and the combined-set
  re-verification catches cross-issue breakage that per-branch checks miss.
