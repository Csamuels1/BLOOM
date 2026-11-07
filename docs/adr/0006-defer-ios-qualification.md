# ADR-0006: Defer iOS qualification to Phase 13

- Status: Accepted by owner; repository implementation pending publication
- Date: 2026-10-07
- Tracking: [#4](https://github.com/Csamuels1/BLOOM/issues/4), [#58](https://github.com/Csamuels1/BLOOM/issues/58)

## Context

The owner has neither a Mac nor an iPhone and explicitly requested deferring all iOS work until the application is built so earlier phases can progress. Hosted simulator attempts failed before app assertions. The longer driver timeout did not resolve the failure. Diagnostics showed Xcode 16.4, an iOS 26.2 simulator, and an Expo Go launch timeout; the precise root cause is not established.

## Decision

Amend ADR-0002 only for iOS-specific acceptance in Phases 1–12. Defer iOS runtime testing, native builds, accessibility/device checks, purchase/notification tests, and related fixes to Phase 13. Keep cross-platform implementation and the existing all-platform bundle export checks. Do not remove iOS support or treat a bundle export as runtime evidence.

Earlier phases may close after all non-iOS requirements and approvals pass, with the explicit status "iOS verification deferred—not passed." Before closing any such phase, add its exact outstanding iOS tests and dependencies to issue #58. The exception does not waive Android, web, security, clinical, legal, or other approval gates, and does not authorize commits, pushes, merges, or releases.

Retain the iOS smoke workflow as manual-only during development. Its historic failures remain visible. Do not rerun or troubleshoot it during the deferral unless the owner asks. Restore the pull-request trigger and require a passing iOS check before Phase 13 closes.

## Mandatory Phase 13 acceptance

- [ ] Establish a compatible, recorded Xcode/simulator/Expo Go/Maestro toolchain; investigate both driver and Expo Go launch failures.
- [ ] Restore automatic iOS CI and require it in branch protection.
- [ ] Pass foundation cold launch, forward/return navigation, and direct links from #4.
- [ ] Complete every iOS requirement carried forward from Phases 1–12, including accessibility, auth, onboarding, persistence, logging, recommendations, context/notifications, community and subscriptions as applicable.
- [ ] Run development/preview builds and supported real-device qualification with authorized account/signing access.
- [ ] Attach dated test evidence and resolve release-blocking defects before signing off #58.

Phase 14 still requires signed production iOS artifacts and store-package validation. No store-ready claim is permitted without successful iOS qualification.

## Consequences

Development can progress without an Apple device today, but platform-specific defects may be discovered later and require rework. Phase 13 must reserve time and access for the entire accumulated backlog; the app is not fully verified when Phase 12 ends.
