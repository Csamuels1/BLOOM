# Changelog

All notable changes to BLOOM will be documented here.

The format follows Keep a Changelog principles. Releases use semantic versioning after the initial store-ready MVP.

## Unreleased

### Added

- Issue #4: scoped coverage YAML upgrade removes sprintf-js from the dependency tree; four regression tests cover loader and CLI compatibility. Braces and node-forge advisories remain unresolved.

- Issue #4: locally integrated security-fixed URI decoder with a fail-fast install patch and five regression tests; three other root advisories remain unresolved.

- Phase 0 repository governance and product documentation.
- Issue #4: Expo Router starter, exact-version dependency lockfile, NativeWind integration, development/preview/simulator/production build profiles, and foundation test tooling (verification in progress).
- Issue #4: tested security overrides for selector-parser and Xcode's UUID dependency, five toolchain regression tests, and a blocking dependency-audit CI job. Four upstream advisories remain unresolved.
- Issue #4: prepared GitHub-hosted iOS simulator smoke workflow with checksum-verified Maestro and three simulator-selection tests. Remote execution and iOS acceptance remain pending.
