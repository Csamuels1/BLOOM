# Contributing to BLOOM

## Before starting

1. Confirm the active phase in `docs/BUILD_STATUS.md`.
2. Select a Ready issue from that phase and assign it.
3. Move it to In Progress.
4. Branch from the latest `main` using `type/issue-N-short-description`.
5. Read the issue acceptance criteria, safety notes, and documentation impact.

## Branch and commit conventions

Allowed branch prefixes include `docs`, `chore`, `feat`, `fix`, `test`, and `security`.

Use conventional commit subjects:

- `docs(scope): summary`
- `chore(scope): summary`
- `feat(scope): summary`
- `fix(scope): summary`
- `test(scope): summary`
- `security(scope): summary`

Keep commits focused on one issue. Follow the approval checkpoints in `AGENTS.md` before every commit and push.

The initial issue #1 bootstrap is committed directly to `main` because an empty repository has no target branch. This exception ends as soon as the first push creates `main`.

## Pull requests

- Target `main`.
- Link the issue with `Closes #N`.
- Complete every PR-template section.
- Include screenshots or recordings for visual changes.
- Record commands and results for automated and manual verification.
- Identify health-safety, privacy, accessibility, security, and voice impact.
- Do not merge with failing or pending required checks.
- Do not merge without explicit approval.

## Review priorities

Review in this order:

1. User safety and non-judgmental behavior.
2. Authorization, privacy, and secret handling.
3. Correctness and failure handling.
4. Accessibility.
5. Test coverage and maintainability.
6. Visual polish and performance.

## Local validation

Run `npm ci`, `npm run verify`, `npm run doctor`, and `npm run export`. The verification command checks TypeScript, ESLint, formatting, Jest tests, and Expo dependency compatibility. Repository-policy checks remain in CI. See [development setup](docs/DEVELOPMENT.md) for device smoke tests and EAS prerequisites. A bundle export does not replace a device test.
