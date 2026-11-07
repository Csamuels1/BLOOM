# Dependency mitigations and audit allowlist — issue #4

Status: owner-approved audit allowlist for build-time Expo tooling (2026-11-07). See [ADR-0007](adr/0007-dependency-audit-allowlist.md). This is **not** a production signing, clinical, legal, or release-gate waiver.

## Audit allowlist decision (2026-11-07)

Every advisory that reaches the shipped application bundle has been resolved. The only remaining user-facing dependency advisory, `zod` ([GHSA-mrhx-c7xc-m3w5](https://github.com/advisories/GHSA-mrhx-c7xc-m3w5)), is fixed by pinning the app's `zod` to `4.6.7`. The remaining 17 `npm audit` advisories all originate in the **Expo CLI / build toolchain** (`@expo/cli`, `@expo/code-signing-certificates`, `tailwindcss` build chain) and are not part of the bundle shipped to users; several are additionally mitigated by `patches/` and package.json `overrides`.

Because these advisories cannot be cleared without upstream Expo releases, the owner approved replacing the previously raw, always-failing `npm audit` gate with an **explicit allowlist gate**:

- The gate is `scripts/security-audit.cjs`, run via `npm run audit:dependencies`.
- It parses `npm audit --json` and **fails on any advisory not on the allowlist**, so a newly introduced advisory, or any advisory on a newly shipped package, still breaks CI.
- Each allowlisted advisory is enumerated with justification in the script and must be mirrored here. The gate reports allowlisted advisories that are no longer present so stale entries are pruned.
- The allowlist records accepted **build-time** risk only. It does not authorize production signing, a release, or any external gate, and it does not cover advisories on shipped runtime dependencies.

Allowlisted advisories (all build-time Expo tooling): `decode-uri-component` (GHSA-qr28-fpjm-wq7f), `deepmerge` (GHSA-gcqx-w48m-w2h4), `glob` (GHSA-3g3m-2fjr-6pw4), `minimatch` (GHSA-g3hv-75wg-m249), `node-forge` (GHSA-86w9-cpqp-85rv, GHSA-4642-5mcj-2rqw, GHSA-6wvx-3r32-xmcg, GHSA-525v-9gp9-w22h, GHSA-7wch-p9px-956x, GHSA-h6cr-wjv9-3cpp, GHSA-4487-j8r4-4g2f, GHSA-5cwg-6vw7-rj6p, GHSA-jc66-7q78-782g, GHSA-8hrf-8g6f-7xwp, GHSA-hqq3-7jhf-c5jx, GHSA-5x38-2vff-x55p), and the build-tooling `zod@3.25.76` instance (GHSA-mrhx-c7xc-m3w5).

Prefer upstream fixed releases once available, removing each patch and allowlist entry only after equivalent regression tests pass.

## braces 3.0.3

- Advisory: [GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm).
- Local patch: `patches/braces+3.0.3.patch`.
- Bound parser stack nesting and recursive compile/expand/stringify AST traversal to 64 levels; reject excessive depth with an explicit SyntaxError before stack exhaustion.
- Tests exercise ordinary nesting, ranges and escaped text, excessive balanced/unbalanced braces and parentheses below the existing input-length cap, and direct deep/cyclic child ASTs.
- Compatibility limit: extreme nesting that previously sometimes worked is now deliberately rejected. This is a local input limit, not an upstream approved change or a general defense against every resource-exhaustion input. Callers must handle invalid-pattern errors; build configuration remains trusted.

## node-forge 1.4.0

- Advisory: [GHSA-86w9-cpqp-85rv](https://github.com/advisories/GHSA-86w9-cpqp-85rv).
- Local patch: `patches/node-forge+1.4.0.patch`.
- Backport the nested DigestAlgorithm element-count check proposed in [upstream PR #1152](https://github.com/digitalbazaar/forge/pull/1152). The upstream proposal was not a released fix when inspected on 2026-10-08.
- Require exactly the OID plus the optional NULL recognized by the validator. Retain the outer DigestInfo check.
- Tests use ephemeral synthetic RSA keys and validly signed test structures to exercise the verification/parser boundary: valid SHA-256 with present/absent NULL succeeds; extra nested elements with/without NULL and extra outer elements are rejected; a mismatched digest fails.
- These are parser regression tests, not a comprehensive cryptographic review or proof against all signature-forgery techniques. Independent security review and real signing qualification remain required.

## Patch lifecycle

1. Use `npm ci` with scripts enabled for app development/builds. Failed patch application must stop installation.
2. Run the full test suite, Expo Doctor and exports after any dependency update.
3. Keep the allowlist gate meaningful: it must fail on any advisory not explicitly allowlisted. Only build-time Expo-tooling advisories may be allowlisted, each with justification here and in `scripts/security-audit.cjs`. Do not allowlist an advisory on a shipped runtime dependency, and do not weaken branch protection, without a separate documented approval.
4. Recheck upstream releases and replace the local mitigations when a compatible published fix is verified.

The URI decoder compatibility patch and scoped coverage YAML override remain documented in ADR-0005; neither is reverted by this work.
