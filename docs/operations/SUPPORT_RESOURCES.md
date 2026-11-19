# Support resources — curation and per-release reverification

How BLOOM's "Talk to someone" resources are added, shown, and kept current.

- Related: issue #49, [SECURITY_BASELINE.md](../SECURITY_BASELINE.md), clinical sign-off #50.

## What members see

- The Support screen (`/support`) is **always reachable** from Home and from the gentle check-in. It always shows a way to reach out (a trusted person, their own doctor or midwife) and an emergency notice, even with no regional resources and offline.
- Regional resources appear only when they are **active, verified, and dated**. The database enforces this: `is_active` requires `verified` and a `reviewed_at` date, and members can read only active + verified rows (RLS). Crisis help is listed first; each resource shows its classification (category) and the date it was last reviewed.
- Messages are non-diagnostic. The gentle check-in only appears when the server-side engine (#48) flags a concerning pattern, and it never names a condition.

## Current state

No real resources are active yet. The seeded rows are development placeholders (unverified, inactive), so members currently see the always-available fallback only. Real resources are added and activated as part of clinical sign-off (#50).

## Adding or updating a resource (staff, service role)

1. Confirm the resource with its provider: name, region (`nigeria`, `united_states`, `global`), category (`crisis`, `mental_health`, `dietitian`, `postpartum`, `general`), contact details.
2. A qualified reviewer approves it for BLOOM's audience.
3. Insert or update with `verified = true`, `reviewed_by`, `reviewed_at = now()`, bump `version`, then set `is_active = true`.

## Per-release reverification (required)

Before every release:

1. List active resources with their `reviewed_at`.
2. Re-check each one (still operating, contact details correct, still appropriate). Update `reviewed_at` and `version` when confirmed.
3. Deactivate (`is_active = false`) anything that can't be confirmed — the always-present fallback keeps support reachable meanwhile.
4. Record the reverification in the release checklist.

A release does not ship with an active resource that has not been reverified for that release.
