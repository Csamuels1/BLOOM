# BLOOM

**Your body, your pace.**

BLOOM is a mobile weight-management companion designed first for postpartum women. It supports healthy loss, healthy gain, and maintenance without shame-based language or punitive mechanics.

The application will be built with React Native, Expo, TypeScript, Supabase, and RevenueCat for iOS and Android. The launch content covers Nigeria and the United States.

## Project status

Phase 0 is complete. The project is in **Phase 1: Expo and Design-System Setup**, starting with [issue #4](https://github.com/Csamuels1/BLOOM/issues/4). The starter app is a technical preview, not a working health product.

- [Build status](docs/BUILD_STATUS.md)
- [BLOOM MVP project board](https://github.com/users/Csamuels1/projects/1)
- [Product brief](docs/PRODUCT_BRIEF.md)
- [Implementation plan](docs/PROJECT_PLAN.md)
- [Brand and copy guide](docs/BRAND_AND_COPY.md)
- [Contributing](CONTRIBUTING.md)
- [Security baseline](docs/SECURITY_BASELINE.md)

## Run the starter app

Use Node.js `24.14.0` and npm `11.9.0` (see `.nvmrc`).

```sh
npm ci
npm run start -- --go
```

Open with an SDK 57-compatible Expo Go app, or use an approved development build. Run `npm run web` for the browser preview. On Windows PowerShell, use `npm.cmd` / `npx.cmd` if execution policy blocks the `.ps1` launchers; no execution-policy change is needed.

```sh
npm run verify
npm run doctor
npm run export
```

See [development and build setup](docs/DEVELOPMENT.md) for platform requirements, EAS profiles, and outstanding verification gates. No backend credentials are required for this scaffold.

## Working agreement

Every independently testable change is tracked by a GitHub issue and developed on an issue branch. No phase advances until its exit gate passes. Commits, pushes, pull-request merges, releases, and production changes require the approvals documented in [AGENTS.md](AGENTS.md).

## License

The owner confirmed on 2026-10-07 that BLOOM will continue without an open-source license for now ([decision #2](https://github.com/Csamuels1/BLOOM/issues/2)). The repository remains public; this decision does not make its contents private or grant an open-source license for reuse. Any future license or distribution terms require owner approval. Third-party dependencies retain their own licenses, which must be reviewed before distribution.
