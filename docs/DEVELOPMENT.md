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

`npm run verify` combines types, lint, formatting, seven app tests, twenty-two Node toolchain regression tests, and dependency compatibility. Application CI additionally runs Expo Doctor and exports all platforms. A separate `dependency-audit` job runs `npm run audit:dependencies` and fails for moderate-or-higher findings; it currently cannot pass. CI requires no signing credentials and does not build native binaries or deploy. Require `application-checks` and `dependency-audit` alongside `repository-policy` in branch protection before the Phase 1 gate closes. No protection settings have been changed by this local work.

Application installs must include development dependencies and run postinstall: pinned patch-package applies `patches/query-string+7.1.3.patch` to bridge the security-fixed decoder's ESM default into its CommonJS consumer. A failed patch aborts installation. Do not use `--ignore-scripts` for builds or tests; the audit-only CI job may use it because it does not execute application code. See [ADR-0005](adr/0005-expo-foundation-toolchain.md#uri-decoder-compatibility-patch).

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

- [ ] DEFERRED to Phase 13 #58, not passed: iOS cold launch, welcome screen, forward navigation, return, direct foundation link.
- [x] Android: the same flows, plus system Back (Expo Go smoke test, not a signed native build).
- [ ] Web: cold launch, forward/return navigation, refresh `/foundation`, keyboard focus/activation.
- [ ] Large text and screen-reader link/header announcements; no clipped content on small screens.
- [ ] Development and preview native build evidence once authorized accounts/identifiers are available.

Record OS/device, build/client version, commands, date, results, and screenshot/log location. Automated Router tests and successful bundle exports are useful evidence but do not tick native runtime checks. Under [ADR-0006](adr/0006-defer-ios-qualification.md), iOS-specific portions of the accessibility and native-build checks are also deferred to #58. Do not close issue #4 or start #5 while required non-iOS acceptance is outstanding.

### Follow-up verification: 2026-10-08

- Published checkpoint `77599b9`: [application CI](https://github.com/Csamuels1/BLOOM/actions/runs/37737257027) passed 29 tests, Doctor, and all-platform exports; [repository policy](https://github.com/Csamuels1/BLOOM/actions/runs/37737256802) passed. Dependency audit remains failing for braces and node-forge; local mitigations are not an upstream fix or security approval.
- Subsequent Android retry used a cold boot without loading or saving snapshots, with no device-data wipe. Dismissing the Android system dialogs temporarily recovered Expo Go and the welcome screen with its explicit link label. Metro returned `packager-status:running` on IPv4 loopback and the device reverse mapping was present, but Expo Go reported a CLI connection error. After force-stop/relaunch it stalled at the BLOOM splash screen; UI automation returned a null root. Local diagnostic screenshot: `C:/tmp/bloom-retry.png`. No new navigation, large-text, small-screen, or TalkBack pass is claimed, and font scale was not changed. The source of the relaunch failure remains unresolved.
- Clean `npm ci` reapplied the URI decoder, braces, and node-forge patches. All 29 tests and 21 Expo Doctor checks passed, including six new mitigation regressions.
- Android, iOS, and static web bundle exports passed after the changes; no new signed native build or iOS runtime check was performed.
- Both navigation Pressables now have explicit accessible names. Router tests exercise link roles/names and screen headings, not just visible text.
- Android 14 Pixel emulator / Expo Go 57.0.9: the patched app bundled and the welcome screen rendered, but a persistent Android "Process system isn't responding" dialog prevented reliable interaction checks. This attempt does not count as a passing navigation, large-text, small-screen or TalkBack test. The original font-scale setting was read but not changed. Diagnostic screenshot: `C:/tmp/bloom-runtime.png` (local only).
- Browser skill recovery found no connected browser. Web keyboard/navigation/refresh checks remain blocked, not passed. HTTP/bundle results are not substitutes for browser interaction.
- iOS runtime work remains deferred to #58. Native builds still require authorized account/project setup.
- The preview server was stopped. The normal emulator shutdown stalled, so only the identified test-emulator process started for this run was stopped; no device data was wiped and the font-scale setting was never changed.

### Earlier verification: 2026-10-07

- TypeScript, ESLint, formatting, six Jest tests, Expo dependency check, and all 21 Expo Doctor checks passed locally.
- iOS, Android, and static web production bundle exports passed; native binaries have not been built.
- Pixel emulator, Android 14, Expo Go 57.0.9: cold launch, welcome content, navigation forward, return link, system Back, and direct `/foundation` link passed. UI hierarchy and screenshots were inspected. NativeWind styles render on the native View/Text/Pressable elements. The development-menu overlay belongs to Expo Go, not BLOOM.
- Local screenshots: `C:/tmp/bloom-welcome.png` and `C:/tmp/bloom-foundation.png`. Attach these to the eventual PR; they are not published by this change.
- Web development server returned HTTP 200 with BLOOM content. Browser interaction testing remains unverified because the browser skill found no available browser connection; no substitute browser session was used.
- The owner confirmed that neither a Mac nor an iPhone is available. The prepared GitHub-hosted simulator workflow below is the proposed alternative. Windows can export the iOS bundle but cannot run an iOS Simulator. iOS runtime acceptance remains unverified.
- Android's initial system-UI stall and IPv6/IPv4 loopback mismatch were resolved before the passing smoke test. The test emulator and preview server were stopped afterward.
- A fresh `npm ci` followed by `npm run verify` and `npm run doctor` passed. GitHub CI will run only after a separately approved commit/push/PR.

### iOS simulator CI: failed retry, now deferred

`.github/workflows/ios-smoke.yml` is retained as manual-only under ADR-0006; restore pull-request runs in Phase 13. It uses a standard `macos-15` runner, an available iPhone simulator, SDK-compatible Expo Go, and checksum-verified Maestro 2.11.0. `.maestro/ios-foundation.yml` exercises launch, forward/return navigation, and the direct foundation link. Available logs, screenshots, toolchain diagnostics, and JUnit results are retained for one day. Simulator selection has three local unit tests; YAML parsing is not evidence that iOS runtime tests pass.

[The retry on commit 6ded451](https://github.com/Csamuels1/BLOOM/actions/runs/37630102414) also failed before app assertions, despite a 300,000 ms driver timeout. Diagnostics recorded Xcode 16.4 with an iOS 26.2 simulator and a separate Expo Go open-URL timeout. The screenshot showed the simulator home screen, not BLOOM. No passing iOS test is claimed. The owner deferred investigation and all iOS-specific qualification to Phase 13; see #58. Application and repository checks passed on the same commit; dependency audit remains failing.

[The first iOS run](https://github.com/Csamuels1/BLOOM/actions/runs/37627941962) booted the simulator and installed Expo Go, but Maestro's XCTest driver timed out before app assertions began. A proposed follow-up allows 300,000 ms for driver startup, a bounded ten-minute smoke step, and explicit debug output plus Xcode/runtime diagnostics. This is a mitigation to test, not a confirmed fix; persistent failure requires driver/toolchain investigation rather than repeated timeout increases. See the [Maestro timeout change](https://github.com/mobile-dev-inc/Maestro/blob/main/CHANGELOG.md) and [CLI debug-output reference](https://github.com/mobile-dev-inc/maestro-docs/blob/main/maestro-cli/maestro-cli-commands-and-options.md).

[Application CI](https://github.com/Csamuels1/BLOOM/actions/runs/37627942072) passed verification, Doctor, and all-platform exports for commit `c622bf0`; its separate dependency audit failed as expected. [Repository policy](https://github.com/Csamuels1/BLOOM/actions/runs/37627941874) passed on retry after GitHub returned HTTP 500 for an existing issue link. No link changes or check suppressions were needed. Draft PR #66 remains unmergeable pending acceptance and security resolution.

Standard GitHub-hosted runner usage is free for public repositories ([GitHub runner documentation](https://docs.github.com/en/actions/reference/runners/github-hosted-runners)); this job is disabled if the repository becomes private. Artifact storage remains subject to the account's normal quota. No paid runner, Apple signing, EAS project, or production application registration is configured. Commit and push still require separate owner approvals, and opening a PR requires approval before triggering this proposed run. Fix any actual runner failures before checking off iOS acceptance. Expo Go smoke coverage does not replace later development/preview native builds or physical-device accessibility testing.

## Dependency audit status

### Current follow-up: 2026-10-08

The coverage YAML fix is now published in `352f78a` with passing application/repository CI. Version-specific local mitigations for the two remaining findings are recorded in [temporary dependency mitigations](SECURITY_PATCHES.md): bounded braces nesting and the proposed upstream node-forge nested element-count check. Regression tests pass, but these are not released fixes or an independent security approval. npm audit still flags the original versions, and the audit job remains unchanged and failing. Do not describe this work as a clean audit or a completed issue.

The URI decoder fix is published in `4dd7873`; application/repository CI passed. A new local override scopes js-yaml 4.3.2 to the NYC configuration loader and removes its argparse 1/sprintf-js chain. A clean install confirms sprintf-js is absent. The current audit lists only two root advisories, braces and node-forge (56 propagated high-severity entries, zero moderate). It still exits nonzero; no suppression or waiver is added. Registry counts may change independently of the lockfile.

Four new regression checks cover actual dependency resolution/lockfile absence, NYC YAML inheritance and key normalization, CLI help/stdin conversion, and malformed/JavaScript-specific tag rejection. This is a tooling-only change; iOS runtime work remains deferred. The scoped upgrade and regression fixtures require commit/push approval and remote CI validation. See [ADR-0005](adr/0005-expo-foundation-toolchain.md#coverage-yaml-dependency-override) for schema compatibility limits.

The latest published braces 3.0.3 and node-forge 1.4.0 are still affected. Neither advisory lists a fixed release. Do not invent a patched version, force an Expo downgrade, or silently accept the findings. Further remediation requires a compatible dependency replacement, a reviewed maintained patch, or a separately approved risk decision; no such exception is currently authorized.

### Earlier audit evidence

The initial 2026-10-07 audit reported 71 affected dependency entries from six underlying advisories. Two targeted overrides now resolve the selector-parser and UUID advisories. The revised audit reports 62 affected entries (54 high, 8 moderate) from four underlying advisories. npm propagates severity through parent packages, so the affected-package counts are not counts of distinct vulnerabilities. This is still a failing security audit, not a production-ready baseline.

Later on 2026-10-07, a local follow-up upgrades the URI decoder to the upstream fixed 0.5.0 release with a one-line query-string compatibility patch. The latest audit returned 59 affected entries (54 high, 5 moderate) from three root advisories: braces, node-forge, and sprintf-js. Counts can vary as registry advisory metadata changes; root findings and actual resolved versions, not a lower total alone, determine remediation. The pinned patch tool adds development dependencies but no new root advisory appeared in this audit. The decoder finding is removed; the security gate is still failing. This follow-up requires commit/push approval and CI validation.

| Root dependency         | Advisory                                                                 | Area requiring review                                     |
| ----------------------- | ------------------------------------------------------------------------ | --------------------------------------------------------- |
| braces                  | [GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm) | Build/test glob parsing                                   |
| decode-uri-component    | [GHSA-vcc3-ghjq-m6fr](https://github.com/advisories/GHSA-vcc3-ghjq-m6fr) | Fixed locally with 0.5.0 override and tested caller patch |
| node-forge              | [GHSA-86w9-cpqp-85rv](https://github.com/advisories/GHSA-86w9-cpqp-85rv) | Expo certificate tooling                                  |
| postcss-selector-parser | [GHSA-rj75-hqrm-r3gf](https://github.com/advisories/GHSA-rj75-hqrm-r3gf) | Fixed with 7.1.6 override; consumer regressions pass      |
| sprintf-js              | [GHSA-hp3w-g68c-fv3c](https://github.com/advisories/GHSA-hp3w-g68c-fv3c) | Test coverage tooling                                     |
| uuid                    | [GHSA-w5hq-g745-h8pq](https://github.com/advisories/GHSA-w5hq-g745-h8pq) | Fixed with Xcode-scoped 11.1.1 override; regressions pass |

Track resolution under #4 and the #7 Phase 1 gate: review upstream fixes and compatibility, add regression tests for any override, and rerun clean installation, Doctor, bundles and runtime checks. Do not use `npm audit fix --force`: suggested changes include incompatible major upgrades and even an Expo downgrade. Do not suppress audit results or interpret development-only exposure as permission to waive release review.

Remaining investigation, 2026-10-07:

- `braces` 3.0.3, `node-forge` 1.4.0, and `sprintf-js` 1.1.3 are still the latest registry releases and are affected. No patched registry release was available when checked. Keep build inputs trusted, development services local, and signing disabled; these constraints are not a vulnerability fix or release waiver.
- The decoder's ESM-only 0.5.0 release is now integrated by changing query-string's decoder import to `.default`, without changing query-string's public exports. Four Node tests exercise the actual Router dependency chain, normal and malformed query handling, and long malformed inputs in a child process with a ten-second timeout. An additional Jest test verifies ESM transformation without mocking the decoder. These tests do not replace pending Android/web runtime acceptance; iOS remains deferred under ADR-0006.
- `npm run audit:dependencies` returns nonzero until remaining findings are resolved. A passing `verify` or Expo Doctor does not override this failure. No security exception has been approved.
- Five override regression checks pass via `npm run test:toolchain`; both actual consumer paths resolve patched packages. Runtime smoke evidence from before these tooling-only overrides remains recorded above; production exports are rerun after the changes.
