# ADR 0005: Expo foundation toolchain

Status: Proposed implementation for issue #4; native runtime and security verification remain open.

## Decision

Use Expo 57.0.27 (the npm stable `latest` tag verified on 2026-10-07), its supported React 19.2.3 / React Native 0.86.3 pair, and Expo Router. Native dependencies are selected with `expo install`, then pinned to exact resolved versions. Commit the npm lockfile and test direct-version pins.

Use stable NativeWind 4.2.7 with Tailwind 3.4.19, its Babel preset and Metro wrapper. NativeWind's official installation guide explicitly supports SDK 57 in this release; v5 is a release candidate. Reanimated and Worklets use Expo's compatibility map, without adding a duplicate Babel plugin.

Use React Native Testing Library 13.3.3 with react-test-renderer 19.2.3. The initially evaluated v14 renderer resolved a React 19.3 peer requirement, conflicting with the SDK's React 19.2.3. Router's own test stack uses the v13 line. Use SDK-compatible Jest Expo/Jest and keep test files outside the route tree.

Use Node 24.14.0 and npm 11.9.0 locally and in CI. Keep mobile native folders generated and untracked. Configure EAS profiles without inventing account ownership, signing credentials, app identifiers, or a project ID.

## Consequences

### Targeted security overrides

Pin `postcss-selector-parser` to 7.1.6 for its two installed consumers (Tailwind and postcss-nested), and pin `uuid` to 11.1.1 only under `xcode`. UUID 11 retains a CommonJS export and the `v4()` API used by Xcode; newer ESM-only majors are not substituted. Selector-parser 7 changed insertion behavior, so compilation of arbitrary utilities, state variants and nested selectors is regression-tested through the actual consumers. These are intentional cross-major transitive overrides, not evidence of blanket compatibility with every consumer API.

Five Node-based regression checks validate resolved versions, UUID buffer bounds, Xcode identifier generation, Tailwind output, and nested selectors. Keep these overrides until upstream packages adopt patched compatible dependencies, then remove them only with the same checks. See [the audit record](../DEVELOPMENT.md#dependency-audit-status) for unresolved findings.

### URI decoder compatibility patch

Override `decode-uri-component` to the upstream security-fixed 0.5.0 release. Router's only installed consumer, `query-string` 7.1.3, expects a callable CommonJS export; the new decoder exposes an ESM default. Retain query-string's public API and adapt only its import with the version-specific `patches/query-string+7.1.3.patch`. Apply it with pinned patch-package 8.0.1 during postinstall and fail installation if the patch no longer applies. Node 24 can require this synchronous ESM module, Metro transforms it for the app, and Jest explicitly transforms the decoder without replacing it with a mock.

Test actual Router dependency resolution, query round-trips, Unicode/spaces/arrays, malformed sequences, and bounded processing of long malformed input. This introduces maintenance work: remove both the override and patch together only after Router's upstream chain adopts a compatible fixed decoder and the same tests pass. Keep install scripts and development dependencies enabled for application builds; `npm ci --ignore-scripts` is permitted only in the audit job, which does not execute the app.

### Coverage YAML dependency override

Scope `js-yaml` 4.3.2 to `@istanbuljs/load-nyc-config` 1.1.0. Its YAML loader calls `load()`, which exists in v4; the upgraded package uses argparse 2 and removes the sprintf-js dependency. Do not force argparse 2 into the v3 CLI, whose deprecated API differs. No application YAML parser is replaced by this scoped override.

The [v3-to-v4 migration](https://raw.githubusercontent.com/nodeca/js-yaml/4.1.0/migrate_v3_to_v4.md) changes schema behavior: JavaScript-specific tags are no longer accepted and numeric-looking strings should be quoted. BLOOM does not depend on those legacy tags. Regression checks exercise actual NYC YAML inheritance/key normalization, the upgraded CLI, malformed/unsafe YAML rejection, and absence of sprintf-js from the lockfile. Remove the override when the parent adopts a compatible maintained dependency and the same tests pass.

### Scope and limits

- Two minimal routes validate the foundation; product screens and design-system work remain separate issues.
- No backend, personal data collection, telemetry SDK, health calculations, or production deployment is added.
- Expo compatibility is not security approval. Outstanding dependency advisories are documented in [development setup](../DEVELOPMENT.md) and must be resolved or explicitly reviewed before gate closure.
- Native build and device evidence is still required; a JS bundle is not an installable app.

## Sources

- [Expo project creation](https://docs.expo.dev/get-started/create-a-project/)
- [Expo Router installation](https://docs.expo.dev/router/installation/)
- [NativeWind stable installation](https://www.nativewind.dev/docs/getting-started/installation)
- [Expo Jest setup](https://docs.expo.dev/develop/unit-testing/)
- [EAS profiles](https://docs.expo.dev/build/eas-json/)
- Exact package versions and Expo's local `bundledNativeModules.json` were checked during installation.
