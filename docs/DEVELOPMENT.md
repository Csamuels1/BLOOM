# Development and build setup

## Scope

Issue #4 supplies the Expo application foundation, not authentication or a health plan. The two starter routes test navigation and NativeWind styling without collecting data or calling a backend. System fonts and simple styling are temporary; tokens/components belong to #5 and original artwork/fonts to #6/#5 respectively.

## Reproducible local setup

- Node.js 24.14.0, npm 11.9.0; install with `npm ci` using the committed lockfile.
- In PowerShell use `npm.cmd` and `npx.cmd` if script execution is disabled.
- `npm run start -- --go`: Expo Go preview (SDK 57-compatible client required).
- `npm run start -- --dev-client`: an already installed development build.
- `npm run android -- --go`: Android emulator or connected device.
- `npm run ios -- --go`: iOS Simulator on macOS with Xcode; unavailable locally on Windows.
- `npm run web`: web development preview. Web is a foundation check and later supports the moderation admin, not an additional consumer launch platform.

Use local-only networking for unattended checks (`--localhost`). Do not expose the development server publicly. This scaffold needs no `.env` values.

On this Windows host, Node initially resolved localhost to `::1`, while Expo Go connected to `127.0.0.1`. For an Android emulator preview, use this session-local configuration (no machine-wide changes):

```powershell
$env:NODE_OPTIONS='--dns-result-order=ipv4first'
$env:ANDROID_HOME='C:\Users\ichim\AppData\Local\Android\Sdk'
npx.cmd expo start --go --android --localhost --max-workers 2
```

If necessary, run the SDK's `adb reverse tcp:8081 tcp:8081` for the test device. Restart Expo Go after correcting a failed connection. Do not change firewall rules or expose the server to work around a loopback mismatch.

## Quality commands

| Command                      | Checks                                                           |
| ---------------------------- | ---------------------------------------------------------------- |
| `npm run typecheck`          | Strict TypeScript including tests                                |
| `npm run lint`               | Expo ESLint rules, zero warnings                                 |
| `npm run format:check`       | Prettier formatting                                              |
| `npm test`                   | Navigation, deep linking, copy, dependency pins, build profiles  |
| `npm run check:dependencies` | Expo SDK compatibility                                           |
| `npm run doctor`             | Expo project health                                              |
| `npm run export`             | Android, iOS and static web bundles                              |
| `npm audit`                  | Dependency advisories; review separately from Expo compatibility |

`npm run verify` combines types, lint, formatting, six app tests, eight Node toolchain regression tests, and dependency compatibility. Application CI additionally runs Expo Doctor and exports all platforms. A separate `dependency-audit` job runs `npm run audit:dependencies` and fails for moderate-or-higher findings; it currently cannot pass. CI requires no signing credentials and does not build native binaries or deploy. Require `application-checks` and `dependency-audit` alongside `repository-policy` in branch protection before the Phase 1 gate closes. No protection settings have been changed by this local work.

Do not install or update dependencies while tests, Metro, or exports are running. Stop those processes first, then clear Metro's cache after dependency changes.

## EAS profiles and approval boundaries

| Profile     | Purpose                                                          | Environment       |
| ----------- | ---------------------------------------------------------------- | ----------------- |
| development | Internal development client on physical devices/Android emulator | development       |
| simulator   | Development profile with an iOS Simulator artifact               | development       |
| preview     | Internal release-like build; Android APK                         | preview (staging) |
| production  | Store distribution; Android AAB                                  | production        |

All profiles use Node 24.14.0. The local app version is the version source, and builds require committed work. `expo-dev-client` is installed. Profile definitions are not proof of a successful native build.

Before the first authorized EAS build:

1. Owner supplies/authorizes the Expo account and EAS project.
2. Confirm final iOS bundle identifier and Android application ID; none are invented or registered by this scaffold.
3. Link the project and record its actual project ID in configuration, through a reviewed change.
4. Authorize signing credentials and any build usage/costs.
5. Run the selected build profile, e.g. `eas build --profile preview --platform android`, using a reviewed pinned CLI version recorded at setup time.

There is no automatic EAS build, submission, update, production access, or credential provisioning. No original brand assets are claimed as approved.

## Manual acceptance (issue #4 remains open until evidence is recorded)

- [ ] iOS: cold launch, welcome screen, forward navigation, return, direct foundation link.
- [x] Android: the same flows, plus system Back (Expo Go smoke test, not a signed native build).
- [ ] Web: cold launch, forward/return navigation, refresh `/foundation`, keyboard focus/activation.
- [ ] Large text and screen-reader link/header announcements; no clipped content on small screens.
- [ ] Development and preview native build evidence once authorized accounts/identifiers are available.

Record OS/device, build/client version, commands, date, results, and screenshot/log location. Automated Router tests and successful bundle exports are useful evidence but do not tick native runtime checks. Do not close issue #4 or start #5 while its required acceptance is outstanding.

### Verification record: 2026-10-07

- TypeScript, ESLint, formatting, six Jest tests, Expo dependency check, and all 21 Expo Doctor checks passed locally.
- iOS, Android, and static web production bundle exports passed; native binaries have not been built.
- Pixel emulator, Android 14, Expo Go 57.0.9: cold launch, welcome content, navigation forward, return link, system Back, and direct `/foundation` link passed. UI hierarchy and screenshots were inspected. NativeWind styles render on the native View/Text/Pressable elements. The development-menu overlay belongs to Expo Go, not BLOOM.
- Local screenshots: `C:/tmp/bloom-welcome.png` and `C:/tmp/bloom-foundation.png`. Attach these to the eventual PR; they are not published by this change.
- Web development server returned HTTP 200 with BLOOM content. Browser interaction testing remains unverified because the browser skill found no available browser connection; no substitute browser session was used.
- The owner confirmed that neither a Mac nor an iPhone is available. The prepared GitHub-hosted simulator workflow below is the proposed alternative. Windows can export the iOS bundle but cannot run an iOS Simulator. iOS runtime acceptance remains unverified.
- Android's initial system-UI stall and IPv6/IPv4 loopback mismatch were resolved before the passing smoke test. The test emulator and preview server were stopped afterward.
- A fresh `npm ci` followed by `npm run verify` and `npm run doctor` passed. GitHub CI will run only after a separately approved commit/push/PR.

### iOS simulator CI: initial run and pending retry

`.github/workflows/ios-smoke.yml` runs on pull requests using a standard `macos-15` runner, an available iPhone simulator, SDK-compatible Expo Go, and checksum-verified Maestro 2.11.0. `.maestro/ios-foundation.yml` exercises launch, forward/return navigation, and the direct foundation link. Available logs, screenshots, toolchain diagnostics, and JUnit results are retained for one day. Simulator selection has three local unit tests; both YAML files parse successfully. These checks do not establish that the remote workflow passes.

[The first iOS run](https://github.com/Csamuels1/BLOOM/actions/runs/37627941962) booted the simulator and installed Expo Go, but Maestro's XCTest driver timed out before app assertions began. A proposed follow-up allows 300,000 ms for driver startup, a bounded ten-minute smoke step, and explicit debug output plus Xcode/runtime diagnostics. This is a mitigation to test, not a confirmed fix; persistent failure requires driver/toolchain investigation rather than repeated timeout increases. See the [Maestro timeout change](https://github.com/mobile-dev-inc/Maestro/blob/main/CHANGELOG.md) and [CLI debug-output reference](https://github.com/mobile-dev-inc/maestro-docs/blob/main/maestro-cli/maestro-cli-commands-and-options.md).

[Application CI](https://github.com/Csamuels1/BLOOM/actions/runs/37627942072) passed verification, Doctor, and all-platform exports for commit `c622bf0`; its separate dependency audit failed as expected. [Repository policy](https://github.com/Csamuels1/BLOOM/actions/runs/37627941874) passed on retry after GitHub returned HTTP 500 for an existing issue link. No link changes or check suppressions were needed. Draft PR #66 remains unmergeable pending acceptance and security resolution.

Standard GitHub-hosted runner usage is free for public repositories ([GitHub runner documentation](https://docs.github.com/en/actions/reference/runners/github-hosted-runners)); this job is disabled if the repository becomes private. Artifact storage remains subject to the account's normal quota. No paid runner, Apple signing, EAS project, or production application registration is configured. Commit and push still require separate owner approvals, and opening a PR requires approval before triggering this proposed run. Fix any actual runner failures before checking off iOS acceptance. Expo Go smoke coverage does not replace later development/preview native builds or physical-device accessibility testing.

## Dependency audit status

The initial 2026-10-07 audit reported 71 affected dependency entries from six underlying advisories. Two targeted overrides now resolve the selector-parser and UUID advisories. The revised audit reports 62 affected entries (54 high, 8 moderate) from four underlying advisories. npm propagates severity through parent packages, so the affected-package counts are not counts of distinct vulnerabilities. This is still a failing security audit, not a production-ready baseline.

| Root dependency         | Advisory                                                                 | Area requiring review                                     |
| ----------------------- | ------------------------------------------------------------------------ | --------------------------------------------------------- |
| braces                  | [GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm) | Build/test glob parsing                                   |
| decode-uri-component    | [GHSA-vcc3-ghjq-m6fr](https://github.com/advisories/GHSA-vcc3-ghjq-m6fr) | Router query parsing; runtime input exposure              |
| node-forge              | [GHSA-86w9-cpqp-85rv](https://github.com/advisories/GHSA-86w9-cpqp-85rv) | Expo certificate tooling                                  |
| postcss-selector-parser | [GHSA-rj75-hqrm-r3gf](https://github.com/advisories/GHSA-rj75-hqrm-r3gf) | Fixed with 7.1.6 override; consumer regressions pass      |
| sprintf-js              | [GHSA-hp3w-g68c-fv3c](https://github.com/advisories/GHSA-hp3w-g68c-fv3c) | Test coverage tooling                                     |
| uuid                    | [GHSA-w5hq-g745-h8pq](https://github.com/advisories/GHSA-w5hq-g745-h8pq) | Fixed with Xcode-scoped 11.1.1 override; regressions pass |

Track resolution under #4 and the #7 Phase 1 gate: review upstream fixes and compatibility, add regression tests for any override, and rerun clean installation, Doctor, bundles and runtime checks. Do not use `npm audit fix --force`: suggested changes include incompatible major upgrades and even an Expo downgrade. Do not suppress audit results or interpret development-only exposure as permission to waive release review.

Remaining investigation, 2026-10-07:

- `braces` 3.0.3, `node-forge` 1.4.0, and `sprintf-js` 1.1.3 are still the latest registry releases and are affected. No patched registry release was available when checked. Keep build inputs trusted, development services local, and signing disabled; these constraints are not a vulnerability fix or release waiver.
- The decoder has a patched 0.5.0 release, but it is ESM-only. Router's `query-string` 7.1.3 uses `require('decode-uri-component')` as a callable CommonJS export; a direct override would break that contract. Router also uses named imports from query-string, while newer query-string majors have a different export shape. A reviewed upstream backport or separately tested integration is needed; no untested decoder override was added.
- `npm run audit:dependencies` returns nonzero until remaining findings are resolved. A passing `verify` or Expo Doctor does not override this failure. No security exception has been approved.
- Five override regression checks pass via `npm run test:toolchain`; both actual consumer paths resolve patched packages. Runtime smoke evidence from before these tooling-only overrides remains recorded above; production exports are rerun after the changes.
