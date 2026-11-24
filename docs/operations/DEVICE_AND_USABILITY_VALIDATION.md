# Device qualification and postpartum usability validation

The plan for #56, and the single checklist for every device and iOS check
deferred since Phase 1 (#58, ADR-0006). Every automated check already passes;
this covers what only real phones and real people can confirm. Nothing here has
been run yet. Results are recorded in the tables below and linked from #56
and #58.

## Part 1: Device matrix

Run every journey in Part 2 on each device. Use **test accounts with made-up
data**, never a participant's real health data.

| Platform | Device class                     | OS                       | Why                                    |
| -------- | -------------------------------- | ------------------------ | -------------------------------------- |
| iOS      | Current iPhone (6.1")            | Latest iOS               | Primary target                         |
| iOS      | Small or older iPhone (SE-class) | Oldest supported iOS     | Small screens, safe areas, performance |
| Android  | Mid-range (Pixel-class)          | Latest Android           | Primary target                         |
| Android  | Low-end device common in Nigeria | Oldest supported Android | Performance, memory, slow networks     |
| Web      | Desktop browser                  | Current Chrome or Safari | Staff moderation queue only            |

Repeat key journeys with: **VoiceOver or TalkBack on**, **largest text size**,
**Reduce Motion on**, **throttled network** (slow 3G), and **airplane mode**.

## Part 2: Consolidated device checklist

Tick each item per platform. iOS items come from the #58 deferrals (Phases 1–8);
both-platform items come from Phase 12 (#54).

### Sign-in and accounts

- [ ] iOS: run `.maestro/ios-auth.yml` (sign-in, deep-link guard, registration, 18+ gate)
- [ ] Verified sign-up → home; sign-out; the password-reset link sets a new password (needs a seeded verified test account and a mailbox)

### Onboarding

- [ ] Full flow: welcome, goal, pregnancy care boundary, postpartum status and months, optional feeding and cycle (including skip), stats, region and units, dietary and allergens, plan reveal, finish
- [ ] One light haptic tap on finish; no confetti or celebration

### Today and meals

- [ ] Entrance, press and expand animations; meal-card expand; quick-log and the Pro affordance; scroll performance
- [ ] Layout across device sizes and safe areas

### Weight, progress and photos

- [ ] Add, edit and delete weight; input kept on failure; one haptic tap on save, none on error
- [ ] Progress chart and summary; gentle milestones
- [ ] Photos: pick, upload, display, replace and delete on a real device

### Cycle, postpartum and reminders

- [ ] Cycle add, edit and delete; the uncertainty-aware insight; keep-vs-delete when turning tracking off
- [ ] Turning cycle tracking on or off survives a failed save (reverts, shows an error)
- [ ] Postpartum card shown only for postpartum profiles
- [ ] Reminders: the permission prompt appears only on opt-in; delivery happens; cancel on disable; **lock-screen text shows no health details**

### Community, support and settings

- [ ] Community feed, posting, support reactions, report and block (Pro test account)
- [ ] Support ("Talk to someone") is reachable from Home in one tap, and the emergency notice shows
- [ ] Settings: plan, cycle toggle, **export opens the share sheet with the JSON**, delete account (test account only)
- [ ] Paywall: shows "unavailable" until store products exist (live purchases are ADR-0012)

### Accessibility and resilience (every platform)

- [ ] VoiceOver and TalkBack: header order, button labels, expanded state on meal cards, live-region announcements, the chart's in-words summary, form labels, switch roles
- [ ] Largest text size: nothing clipped or overlapping
- [ ] Reduce Motion: no animation anywhere
- [ ] Throttled network: loading states appear and nothing fails silently
- [ ] Airplane mode: the Support fallback shows, with no crashes or unhandled errors

### Restore automatic iOS checks (required before #58 closes, per AGENTS.md)

- [ ] `ios-smoke.yml` runs automatically again (it has been manual-only since Phase 1)

## Part 3: Postpartum usability sessions

### Who

5–8 participants per region (Nigeria, United States), aged 18+, who are
postpartum or recently were. Between them, sessions must cover **all three
goals** (loss, maintenance, gain), breastfeeding, formula and mixed feeding,
and cycle tracking both on and off.

### Safety and wellbeing (read before recruiting)

- **Screen out** anyone currently in treatment for an eating disorder, unless a
  clinician on the study team approves. This population is at elevated risk.
- **Get qualified input** (for example the #50 clinician) on the protocol and
  the distress procedure before the first session.
- **Distress procedure:** if a participant becomes distressed, stop the task,
  check in, and offer the Support screen's resources plus local emergency
  services. Never push to continue. Note it as a finding, without personal
  details.
- Weight and body topics are optional. Participants may skip any task.

### Tasks (think-aloud, about 45 minutes)

1. Sign up and complete onboarding for your own situation.
2. Find today's meal ideas and open one.
3. Log a weight entry, then find your progress.
4. If relevant, turn cycle tracking on, log a date, then turn it off.
5. Find where to talk to someone if you were having a hard day.
6. Find your plan details, export your data, and find where to delete your account (don't confirm).
7. (Pro test account) Read the community and react to a post.

Measure task success, time, errors, and **how each step felt**: any moment
that felt judgmental, pressuring or confusing is a finding.

### Participant data protection

- **Consent:** written informed consent covering purpose, recording, storage,
  retention and the right to withdraw.
- **Test accounts only:** participants use study accounts with made-up data,
  and never enter their real weight or health details.
- **Recordings:** screen and audio only (no faces unless consented), kept in
  encrypted storage with access limited to the study team, and deleted
  **90 days** after the study ends.
- **Pseudonyms:** participants are P1, P2 and so on in every note. The
  name-to-pseudonym key is stored separately and deleted with the recordings.
- **No participant data in the repository, GitHub issues or chat.**

## Part 4: Findings and blockers

- File each finding as a GitHub issue, labelled `area:release` plus a
  priority: **P0** (blocks release, safety, or data loss), **P1** (blocks a core
  journey), **P2** (friction), **P3** (polish). No participant-identifying
  details.
- Before #56 closes, every P0 and P1 must be resolved or explicitly accepted by
  the owner.
- Write a short evidence summary into this file: devices tested, sessions run,
  goals covered, findings by priority, and blockers resolved.

## Evidence summary (fill in after testing)

| Item                                        | Result |
| ------------------------------------------- | ------ |
| Devices exercised                           |        |
| Sessions run (Nigeria / US)                 |        |
| Goals covered                               |        |
| Findings (P0 / P1 / P2 / P3)                |        |
| Blockers resolved                           |        |
| Accessibility passes (VoiceOver / TalkBack) |        |
| Automatic iOS checks restored               |        |
