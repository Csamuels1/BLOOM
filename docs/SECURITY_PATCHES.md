# Temporary dependency mitigations — issue #4

Status: local mitigations under review, not security-gate approval.

## Why the audit still fails

The published versions braces 3.0.3 and node-forge 1.4.0 remain covered by their advisories. These version-specific patches change installed source during the existing fail-fast postinstall, but do not invent new package versions or suppress npm audit. The audit-only job deliberately uses `--ignore-scripts` and continues to report the vulnerable published packages. Application CI runs postinstall and regression tests. A green application check is not a green security check.

No production signing, release, or gate waiver is authorized by these changes. Security review must assess the patches and their maintenance before the remaining findings can be considered addressed. Prefer upstream fixed releases once available, removing each patch only after equivalent regression tests pass.

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
3. Keep the raw audit visible. Do not create an allowlist or weaken branch protection without a separate documented approval.
4. Recheck upstream releases and replace the local mitigations when a compatible published fix is verified.

The URI decoder compatibility patch and scoped coverage YAML override remain documented in ADR-0005; neither is reverted by this work.
