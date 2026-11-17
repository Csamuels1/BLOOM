# Moderation Operations — DRAFT (pending owner sign-off)

> **Status: DRAFT. Not approved.** This document is the Phase 9 (#42) draft of
> BLOOM's community rules, staffing model, response procedure, escalation path,
> and tabletop scenarios. Its sign-off is **deferred** by owner decision, recorded
> in [ADR-0011](../adr/0011-defer-moderation-ops-signoff.md). **The community
> stays closed to real users until this document is approved.** No real-user
> moderation decision should be made against this draft.
>
> Closure is enforced by construction, not by this file: posting and reactions
> require an active **Pro** subscription (server-enforced, #119), and no account
> can be Pro until RevenueCat lands in Phase 10. Approving this document is a
> **precondition** for opening the community, not a consequence of it.

- Owner: _unassigned (draft)_
- Last updated: 2026-11-18
- Related: [#42](https://github.com/Csamuels1/BLOOM/issues/42),
  [SECURITY_BASELINE.md](../SECURITY_BASELINE.md),
  [BRAND_AND_COPY.md](../BRAND_AND_COPY.md),
  [ADR-0003 safety/privacy boundaries](../adr/0003-safety-privacy-boundaries.md)

---

## 1. Purpose and scope

BLOOM serves women navigating weight, cycle, pregnancy, and postpartum — a
population with elevated exposure to disordered eating and body-image distress.
The community exists to offer **peer support and belonging**, never comparison,
competition, or advice that could put someone's health at risk. Moderation's job
is to keep the two spaces safe, kind, and private, and to get a real person to
anyone in crisis quickly.

This document covers the **recovery** and **gentle weight care** spaces only. It
does not cover clinical advice (BLOOM gives none), direct messaging (not built),
or any feature outside the community.

## 2. The spaces

| Space               | Internal id   | For                                                                                         |
| ------------------- | ------------- | ------------------------------------------------------------------------------------------- |
| Postpartum recovery | `recovery`    | Postpartum healing, feeding, identity, the fourth trimester.                                |
| Gentle weight care  | `gentle_loss` | Sustainable, non-restrictive weight support. Highest ED-risk space; strictest numbers rule. |

Both spaces follow the same rules below. The gentle-weight-care space warrants
extra vigilance on numbers, restriction, and comparison.

## 3. Community rules (member-facing, drafted)

These are written to be shown to members in calm, non-shaming language once
approved. They are safety rules, not a style guide.

1. **No numbers that invite comparison or restriction.** No weights, goal
   weights, calorie counts, "down X lbs", measurements, clothing sizes, or BMI.
   This protects everyone, including you.
2. **No pro-eating-disorder content.** No restriction tips, purging, fasting as
   weight control, "what I eat in a day" as a target, or glorifying extreme loss.
   This is removed on sight and may lead to escalation.
3. **No food moralising.** Food is not "good", "bad", "clean", or a "cheat".
4. **No before/after or body-check images.** Images are for warmth and daily
   life, not bodies presented for judgement. (Images are reviewed before they go
   live — see §6.)
5. **Be kind. No targeting, shaming, or unsolicited advice about someone's body
   or choices.**
6. **No medical or clinical advice**, no selling, no promotion, no links to
   programs or products.
7. **Protect privacy — yours and others'.** No real names, locations, or
   identifying details about anyone who has not shared them.
8. **If someone is in danger, we act.** Posts suggesting self-harm or a safety
   risk are escalated to a person and met with resources, not silence.

Reporting is always private: the reported member is never told who reported them
(enforced by RLS, #119, tested in pgTAP 0011).

## 4. Staffing model (drafted)

> Roles map to the immutable `app_metadata.role` claim the server trusts
> (`is_moderator()`), set server-side only. There is **no self-service** route to
> moderator or admin, and no service-role key in any client.

| Role                    | Claim         | Can                                                                                                               |
| ----------------------- | ------------- | ----------------------------------------------------------------------------------------------------------------- |
| Moderator               | `moderator`   | Read the queue; keep/remove posts; approve/reject images; start/resolve/dismiss reports. Every action is audited. |
| Admin                   | `admin`       | Everything a moderator can, plus grant/revoke the moderator claim and own escalations.                            |
| On-call escalation lead | admin (named) | Owns crisis/safeguarding escalations during their window.                                                         |

Drafted expectations (to be confirmed at sign-off):

- **Minimum two trained moderators** before the community opens, so no one person
  is the single point of failure and reviews are not self-approved.
- **Coverage**: a target first-response window during stated hours, plus a
  documented out-of-hours path for safety escalations (§5). Exact hours and SLAs
  are a sign-off decision.
- **Training** before a claim is granted: these rules, the ED-awareness context,
  the queue tool, the escalation path, and a run through the §7 tabletop.
- **Wellbeing**: moderators read distressing material; rotation, a second opinion
  on hard calls, and a no-blame culture are expected. The queue copy is kept
  deliberately calm for this reason.
- **Conflict of interest**: a moderator does not action a report they filed or a
  post they authored. (The server also blocks approving your own media, pgTAP
  0011.)

## 5. Response procedure and escalation (drafted)

### Triage by report reason

| Reason                                     | Default first action                                                                          | Target response |
| ------------------------------------------ | --------------------------------------------------------------------------------------------- | --------------- |
| `unsafe` (harmful advice / self-harm risk) | **Escalate immediately** (§ below). Remove the post if it promotes harm.                      | Fastest tier.   |
| `harassment`                               | Start review; remove if targeting/abuse is clear; consider blocking guidance to the reporter. | Fast tier.      |
| `spam`                                     | Remove the post; resolve the report.                                                          | Standard tier.  |
| `other`                                    | Read, judge against the rules, act or dismiss with a note.                                    | Standard tier.  |

Exact SLA clock times are intentionally left for sign-off. Every action is taken
through the audited RPCs and records who/what/when (§6).

### Severity and escalation path

1. **Routine** (spam, mild unkindness): moderator handles in-queue.
2. **Serious** (harassment, repeated violations, pro-ED content): moderator
   removes, documents, and flags to an admin; repeat offenders are escalated for
   an account-level decision.
3. **Safety-critical** (self-harm intent, suicidal ideation, abuse, a minor at
   risk, threat to life): **stop normal flow and get a person involved now.**
   - Notify the on-call escalation lead / admin immediately through the
     out-of-hours channel.
   - Remove content that actively promotes harm; do not delete evidence needed
     for a safety response.
   - The member in crisis is met with **signposting to real help** (regional
     crisis lines / emergency services), never a silent removal. The exact
     resource list and wording are a sign-off item and must be reviewed by a
     qualified person.
   - If there is an immediate threat to life, the path routes to **emergency
     services**, not to the app.

> BLOOM gives no clinical advice. Escalation means getting a trained human and
> the right external resources to the person — it does not mean moderators
> counsel anyone.

## 6. Tooling and auditability

- **Web moderation queue** (#41): staff-only, **web-only** surface. Moderators
  review reports, pending images (short-lived signed previews), and the audit
  history. Authorization is server-enforced; a non-moderator who reaches the
  route reads nothing and every action is declined.
- **Audited transitions** (#119): all status changes go through
  `moderate_post` / `moderate_media` / `review_report` (SECURITY DEFINER,
  moderator-gated), each writing one `moderation_actions` row in the same
  transaction. There is no client-side status write and no way to act
  un-audited.
- **Pending-by-default media**: images are not visible to others until a
  moderator approves them (#119); rejected/pending media never resolves for
  members.
- **Escalation audit expectation**: proven server-side by pgTAP
  `0012_moderation_escalation` — a non-moderator is refused on every read and
  every action, and each moderator action writes exactly one audit row.

## 7. Tabletop scenarios (drafted — for the sign-off exercise)

Run these as a group before opening the community. Each lists the expected
handling against this draft; sign-off confirms or corrects them.

1. **Numbers slip.** A member posts "finally under my goal weight, down 12 lbs!"
   → Rule 1. Remove the post (kindly), resolve any report, note it; no shaming.
   Repeat → serious tier.
2. **Pro-ED advice.** A member shares a restriction/fasting "tip" in
   `gentle_loss` → Rule 2. Remove on sight, document, flag to admin; consider an
   account-level decision for intent.
3. **Self-harm disclosure.** A post expresses suicidal ideation → **safety-
   critical**. Escalate to the on-call lead now; signpost crisis resources; do
   not silently remove; involve emergency services if there is immediate danger.
4. **Harassment + the privacy trap.** Member A reports Member B for targeting.
   The moderator must act **without** revealing A to B (reporter identity is
   never exposed) and may guide A to block B. Verify the queue never surfaces the
   reporter to the reported party.
5. **Image body-check.** A pending image is a body-check "before" shot → Rule 4.
   Reject the image (it never goes live); the post may stand if the text is fine.
6. **Moderator conflict of interest.** A moderator is the author of a reported
   post, or filed the report → they must not action it; another moderator takes
   it. (Server also blocks self-approval of media.)
7. **Mass spam wave.** A burst of promotional posts → standard removal at pace;
   confirm audit rows are written for each; flag if volume suggests an abuse
   pattern needing an account-level or platform response.

## 8. Approval and sign-off (DEFERRED)

This document is **not approved**. Sign-off requires, at minimum:

- [ ] Owner approval of the community rules (§3) and escalation path (§5).
- [ ] A qualified reviewer (clinical / safeguarding) confirms the crisis
      signposting, resource list, and self-harm handling in §5 and §7.3.
- [ ] Staffing confirmed: at least two trained moderators and a named on-call
      escalation lead, with coverage hours and SLAs filled in (§4, §5).
- [ ] The §7 tabletop run and its corrections recorded.
- [ ] A dated sign-off recorded here and in BUILD_STATUS, replacing the DRAFT
      banner.

Until every box is checked, the community remains closed to real users. See
[ADR-0011](../adr/0011-defer-moderation-ops-signoff.md).
