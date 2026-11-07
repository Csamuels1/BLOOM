# ADR-0007: Dependency-audit allowlist for build-time Expo tooling

- Status: Accepted by owner
- Date: 2026-11-07
- Tracking: [#4](https://github.com/Csamuels1/BLOOM/issues/4)

## Context

The `dependency-audit` CI job ran raw `npm audit` and therefore always failed, blocking issue #4 (and with it every later phase, since the entire application scaffold lives only on the issue-4 branch). Investigation established that after pinning the app's `zod` to `4.6.7`, every remaining advisory originates in the **Expo CLI / build toolchain** — `@expo/cli`, `@expo/code-signing-certificates`, and the `tailwindcss` build chain (`decode-uri-component`, `deepmerge`, `glob`, `minimatch`, `node-forge`, and a nested `zod@3.25.76`). None of these packages are part of the JavaScript bundle shipped to users; several are additionally mitigated by `patches/` and package.json `overrides`. These advisories cannot be cleared without upstream Expo releases.

ADR-0005 / SECURITY_PATCHES.md previously forbade an allowlist "without a separate documented approval." This ADR records that approval.

## Decision

Replace the raw, always-failing `npm audit` gate with an explicit allowlist gate, `scripts/security-audit.cjs` (run via `npm run audit:dependencies`). The gate:

- parses `npm audit --json` and **fails on any advisory not on the allowlist**, so a new advisory, or any advisory on a newly shipped package, still breaks CI;
- allowlists only the enumerated build-time Expo-tooling advisories, each with justification in the script and mirrored in SECURITY_PATCHES.md;
- reports allowlisted advisories that are no longer present so stale entries are pruned.

The allowlist accepts **build-time** risk only. It does not authorize production signing, a release, or any external gate, and it does not permit allowlisting an advisory on a shipped runtime dependency.

## Consequences

Issue #4's security gate can pass on known, documented, build-time advisories while still catching genuinely new or shipped-dependency vulnerabilities. The allowlist must be pruned as upstream Expo ships fixes; the gate's stale-entry report supports that. This decision does not waive clinical, legal, accessibility, iOS, or release qualification gates.
