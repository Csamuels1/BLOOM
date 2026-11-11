# Dependency mitigations and audit allowlist — issue #4

Status: owner-approved audit allowlist for build-time Expo tooling (2026-11-07). See [ADR-0007](adr/0007-dependency-audit-allowlist.md). This is **not** a production signing, clinical, legal, or release-gate waiver.

## Audit allowlist decision (2026-11-07)

Every advisory that reaches the shipped application bundle has been resolved. The only user-facing dependency advisory, `zod` ([GHSA-mrhx-c7xc-m3w5](https://github.com/advisories/GHSA-mrhx-c7xc-m3w5)), is fixed by pinning the app's `zod` to `4.6.7`. After aligning Expo SDK 57 to its current patch releases (which brought `node-forge` 1.4.3 with an upstream canonical-DigestInfo fix and cleared the nested `zod@3.25.76`), 4 `npm audit` advisories remain. All originate in the **Expo CLI / build toolchain** (`@expo/cli`, `@expo/code-signing-certificates`, `tailwindcss` build chain) and are not part of the bundle shipped to users; the `decode-uri-component` finding is additionally mitigated by package.json `overrides` and `patches/query-string`.

Because these advisories cannot be cleared without upstream Expo releases, the owner approved replacing the previously raw, always-failing `npm audit` gate with an **explicit allowlist gate**:

- The gate is `scripts/security-audit.cjs`, run via `npm run audit:dependencies`.
- It parses `npm audit --json` and **fails on any advisory not on the allowlist**, so a newly introduced advisory, or any advisory on a newly shipped package, still breaks CI.
- Each allowlisted advisory is enumerated with justification in the script and must be mirrored here. The gate reports allowlisted advisories that are no longer present so stale entries are pruned.
- The allowlist records accepted **build-time** risk only. It does not authorize production signing, a release, or any external gate, and it does not cover advisories on shipped runtime dependencies.

Allowlisted advisories (all build-time Expo tooling): `decode-uri-component` (GHSA-qr28-fpjm-wq7f), `deepmerge` (GHSA-gcqx-w48m-w2h4), `glob` (GHSA-3g3m-2fjr-6pw4), and `minimatch` (GHSA-g3hv-75wg-m249).

Prefer upstream fixed releases once available, removing each patch and allowlist entry only after equivalent regression tests pass.

## braces 3.0.3

- Advisory: [GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm).
- Local patch: `patches/braces+3.0.3.patch`.
- Bound parser stack nesting and recursive compile/expand/stringify AST traversal to 64 levels; reject excessive depth with an explicit SyntaxError before stack exhaustion.
- Tests exercise ordinary nesting, ranges and escaped text, excessive balanced/unbalanced braces and parentheses below the existing input-length cap, and direct deep/cyclic child ASTs.
- Compatibility limit: extreme nesting that previously sometimes worked is now deliberately rejected. This is a local input limit, not an upstream approved change or a general defense against every resource-exhaustion input. Callers must handle invalid-pattern errors; build configuration remains trusted.

## node-forge (patch removed on 2026-11-07; fixed upstream in 1.4.3)

- Advisory: [GHSA-86w9-cpqp-85rv](https://github.com/advisories/GHSA-86w9-cpqp-85rv) and related node-forge advisories.
- The former `patches/node-forge+1.4.0.patch` backported the nested DigestAlgorithm element-count check from [upstream PR #1152](https://github.com/digitalbazaar/forge/pull/1152) while no released fix existed.
- Aligning Expo SDK 57 to its current patch releases brought `node-forge` 1.4.3, whose RSASSA-PKCS1-v1_5 verifier now re-encodes DigestInfo canonically (with and without NULL parameters) and compares bytes — a stricter superset of the patch. The local patch no longer applied and was removed.
- The synthetic-RSA regression tests in `tests/toolchain/pending-security-patches.test.cjs` are retained and pass against unpatched 1.4.3 (valid SHA-256 with present/absent NULL succeeds; extra nested/outer elements and mismatched digests are rejected). They remain regression guards, not a comprehensive cryptographic review; independent security review and real signing qualification remain required.

## Patch lifecycle

1. Use `npm ci` with scripts enabled for app development/builds. Failed patch application must stop installation.
2. Run the full test suite, Expo Doctor and exports after any dependency update.
3. Keep the allowlist gate meaningful: it must fail on any advisory not explicitly allowlisted. Only build-time Expo-tooling advisories may be allowlisted, each with justification here and in `scripts/security-audit.cjs`. Do not allowlist an advisory on a shipped runtime dependency, and do not weaken branch protection, without a separate documented approval.
4. Recheck upstream releases and replace the local mitigations when a compatible published fix is verified.

The URI decoder compatibility patch and scoped coverage YAML override remain documented in ADR-0005; neither is reverted by this work.

## Security-definer database functions (Phase 4)

`SECURITY DEFINER` functions run with the definer's privileges and are reviewed
individually (AGENTS.md Supabase standards).

- `public.delete_current_user()` (migration `20261111135613_...`): lets an
  authenticated user delete their own account. It is **scoped strictly to
  `auth.uid()`** — it never takes a target id — so a caller can only ever delete
  themselves. It sets an empty `search_path`, is revoked from `public`/`anon`,
  and is granted only to `authenticated`. It deletes the `auth.users` row, which
  cascades to all owned rows and invalidates sessions. Private Storage objects
  are removed client-side via the Storage API beforehand (direct deletes from
  `storage.objects` are blocked by a Storage trigger).

`persist_onboarding` and `export_current_user` are `SECURITY INVOKER` (RLS
applies) and also force identity from `auth.uid()`.
