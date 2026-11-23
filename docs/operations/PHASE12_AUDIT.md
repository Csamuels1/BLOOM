# Phase 12 product-polish audit (#54)

The audit matrix for the Phase 12 exit gate. It covers what was checked, how, the
result, and what is carried forward. Run 2026-11-23 against `main` with #51, #52
and #53 merged, plus the fixes made at this gate.

## Matrix

| Area                      | What was checked                                                                                                                                                                 | How                                                                                    | Result                                                              |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| **UX / resilient states** | Every new screen (Settings, legal pages, Support, cycle tracking) has loading, empty, error-with-retry and success states. No action fails silently.                             | Settings state-matrix tests, support UI tests, and the cycle tracking-preference tests | Pass, after one fix (below)                                         |
| **Accessibility**         | Reduced motion skips every animation. Illustrations are hidden from screen readers. Controls are labelled. Touch targets are at least 48dp. Live-region status messages.         | Motion and reduced-motion tests, illustration tests, component tests, design tokens    | Pass (automated). Screen-reader runtime check: see carried forward. |
| **Copy / voice**          | No prohibited language in any copy module. No gamification (streaks, badges, points, levels, loss-aversion phrasing). New copy is registered.                                    | `tests/copy.test.ts`, `tests/design/no-gamification.test.ts`                           | Pass                                                                |
| **Telemetry**             | First-party only, with no replay. Crash payloads are fixed-schema and scrubbed twice. Client and server analytics allowlists match. Every allowlisted event is actually emitted. | pgTAP `0017`, telemetry Jest suites, `tests/toolchain/telemetry-privacy.test.cjs`      | Pass, after one fix (below)                                         |
| **Slow network**          | Slow requests show a loading state. Long flows don't fail on slow machines.                                                                                                      | Delayed-promise tests (Settings), a timeout review of the long flow tests              | Pass, after one fix (below)                                         |
| **Offline**               | Services fail closed: safety signals, resources, settings, telemetry and crash reports never throw. Support shows its always-available fallback with no network.                 | Fail-closed tests (offline → null or false), the SupportScreen fallback test           | Pass                                                                |
| **Build / device**        | The app builds for iOS, Android and web. Expo project health.                                                                                                                    | All-platform `expo export`, `expo-doctor` 21/21                                        | Pass (build). Device runtime: see carried forward.                  |

## Findings fixed at this gate

1. **Cycle-tracking toggle failed silently.** `src/app/(app)/cycle.tsx` changed the toggle straight away, never reverted it when the save failed, never told the user, and could throw an unhandled error. It now uses `useTrackingPreference`, which shows the value the server stored, reverts on failure, and raises a retryable error. `CycleScreen` now follows its parent's value. Four new tests cover this.
2. **Analytics events were never emitted.** The #53 pipeline existed, but nothing called `track()`. All five allowlisted events are now emitted at the point where the action has succeeded: onboarding opened, onboarding saved, weight saved, meal opened, post created. A toolchain test fails if any allowlisted event has no emitter.
3. **Long-flow test timed out on a loaded machine.** `complete-flow.test.tsx` walks a dozen screens on Jest's default 5s timeout. It timed out under load but didn't actually fail. It now has 30s, in line with the other long UI suites.
4. **Stale audit allowlist entry.** The picomatch advisory dropped out of `npm audit` upstream with the installed versions unchanged. It's pruned and documented in `SECURITY_PATCHES.md`, and if it reappears the gate fails and it gets re-assessed.

## Carried forward (not passed here)

- **Device runtime audit.** This build environment can't run physical devices or emulators. Hands-on checks on real hardware are carried to Phase 13 release qualification, alongside the iOS deferral (#58, ADR-0006): screen readers (VoiceOver, TalkBack), haptics feel, motion feel, and throttled-network and airplane-mode runs. The automated equivalents above pass.

## Owner decisions (2026-11-23)

- **Artwork: approved.** The owner approved all five illustrations (#51) after reviewing a rendered preview at preview and in-app sizes on the app's ivory background. Recorded in `assets/brand/README.md`.
- **Legal text: launch blocker.** Privacy policy and Terms stay clearly marked placeholders (#52) until the owner provides final text, ideally reviewed by a lawyer. It must land before any real-user release (Phases 13 and 14).
- **Device runtime audit: carried to Phase 13** (see above), recorded on #58.
