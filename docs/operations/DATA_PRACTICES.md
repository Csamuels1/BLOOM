# BLOOM data practices inventory

Prepared for the Nigeria and US legal, privacy and content review (#57). It
describes what the app **actually does**, as implemented in this repository on
2026-11-24, so counsel can check that the Privacy policy and disclosures match.
It states facts and lists open questions; it does not draw legal conclusions.

BLOOM is a postpartum and weight-care app for adults (18+) in Nigeria and the
United States, built on Supabase (database, authentication, file storage) and
RevenueCat (subscriptions).

## 1. What BLOOM collects

All data below is linked to the user's account (a Supabase user id) unless
noted otherwise. "Export" means it is included in the in-app "Export my data"
copy; "Deleted" means it is removed when the user deletes their account.

| Category         | Data                                                                                                                                                                                         | Why                                               | Visible to                                                  | Export                                    | On account deletion                                                             |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- | ----------------------------------------------------------- | ----------------------------------------- | ------------------------------------------------------------------------------- |
| Account          | Email address, password (hashed by Supabase Auth), sign-in sessions                                                                                                                          | Sign-in                                           | The user; Supabase Auth                                     | Email shown in Settings                   | Deleted                                                                         |
| Profile          | Goal (loss, maintain, gain), height, country, units, postpartum status and months, feeding context, dietary preferences, allergens, cycle-tracking on/off, 18+ confirmation, onboarding date | Tailor plans and meals                            | The user only                                               | Yes                                       | Deleted                                                                         |
| Weight           | Weight entries (kg), dates, optional notes                                                                                                                                                   | Progress tracking                                 | The user only                                               | Yes                                       | Deleted                                                                         |
| Cycle            | Period start dates (only if cycle tracking is on)                                                                                                                                            | Cycle-aware context                               | The user only                                               | Yes                                       | Deleted                                                                         |
| Progress photos  | Photo files (private storage bucket)                                                                                                                                                         | Private progress record                           | The user only                                               | Downloadable in the app (not in the JSON) | Deleted (files removed first)                                                   |
| Community posts  | Post text, space, status                                                                                                                                                                     | Peer support (Pro)                                | Other members once approved; moderators                     | Yes                                       | Deleted                                                                         |
| Community images | Image files plus metadata (type, size, status)                                                                                                                                               | Posts with images                                 | The author; others only once approved; moderators           | Metadata yes; files in the app            | Deleted                                                                         |
| Reactions        | "I am with you" support on posts                                                                                                                                                             | Peer support                                      | Post author sees that someone reacted, never who            | Yes                                       | Deleted                                                                         |
| Reports          | Posts the user reported, reason, optional details                                                                                                                                            | Safety moderation                                 | The reporter and moderators (**never the reported person**) | Yes                                       | Deleted                                                                         |
| Blocks           | Members the user blocked                                                                                                                                                                     | Safety                                            | The user only                                               | Yes                                       | Deleted                                                                         |
| Subscription     | Plan (Free/Pro), status, renewal date                                                                                                                                                        | Entitlement                                       | The user only; written only by the server                   | Yes                                       | Deleted                                                                         |
| Billing events   | Store purchase events from RevenueCat (event type, store, dates)                                                                                                                             | Keep the subscription accurate; audit             | Server only                                                 | No (billing audit)                        | **Kept, de-identified**: the user link is removed                               |
| Analytics events | One of 5 event names (for example "weight logged") and a time. **Never values** such as the weight itself                                                                                    | Basic product usage                               | Server only                                                 | Yes                                       | **Kept, de-identified**: the user link is removed                               |
| Crash reports    | Error type, scrubbed message and stack, app version, platform                                                                                                                                | Fix crashes                                       | Server only                                                 | Yes                                       | Deleted                                                                         |
| Safety signals   | Computed on request from the user's own weight history, and not stored                                                                                                                       | Gentle check-in when a concerning pattern appears | Calculated for the user only; non-diagnostic                | n/a (not stored)                          | n/a                                                                             |
| Moderation audit | Actions moderators take                                                                                                                                                                      | Accountability                                    | Moderators                                                  | n/a                                       | If a **moderator** deletes their account, their actions are kept, de-identified |

## 2. What BLOOM does not collect

- **Precise location.** Only the country the user picks (or device locale) is used.
- **Payment card details.** Purchases are handled entirely by Apple and Google.
- Contacts, advertising identifiers, or data from other health apps.
- **Push notification tokens.** Reminders are scheduled locally on the device.
- Session recordings or screen replays.
- Third-party analytics or crash data. Telemetry is first-party only (ADR-0014).

## 3. Sensitive data

Several categories are health or reproductive data: weight, cycle and period
dates, pregnancy and postpartum status, feeding context, and progress photos.
Protections in place:

- Row-level security makes each of these readable only by the user. Anonymous
  callers have no database access at all, and staff can't read them through the
  app. Proven by automated database tests.
- Progress photos and community images sit in private storage buckets.
- The app never diagnoses. Safety signals produce non-diagnostic wording only.
- Pregnancy blocks calorie targets entirely.

## 4. Service providers (processors)

| Provider                      | What it receives                                                           | Purpose                                                                                    |
| ----------------------------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Supabase                      | All account and app data in section 1                                      | Hosting, database, auth, storage. **The owner must confirm the project's hosting region.** |
| RevenueCat                    | The Supabase user id (as the RevenueCat app user id) and purchase events   | Subscription status                                                                        |
| Apple App Store / Google Play | Purchases and payments (their own accounts)                                | Billing                                                                                    |
| Expo                          | Build and app tooling; no user data is sent for notifications (local only) | App delivery                                                                               |

## 5. User rights as implemented

| Right                        | How it works today                                                                                                                                                                     |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Access / portability         | Settings → Export: a complete JSON copy of everything in section 1 marked "Yes", shared through the device's share sheet. Photos can be downloaded in the app.                         |
| Deletion                     | Settings → Delete account (with confirmation): files are removed, then the account and all linked data are deleted. Billing and analytics records are kept only in de-identified form. |
| Correction                   | Profile answers, weight entries and cycle dates can be edited or deleted in the app.                                                                                                   |
| Withdraw optional processing | Cycle tracking can be turned off (with a choice to keep or delete history). Reminders are opt-in and can be turned off.                                                                |
| Age                          | Users confirm they are 18 or older at sign-up.                                                                                                                                         |

## 6. Content approvals (the "current" state)

| Content                     | Status                                                                       |
| --------------------------- | ---------------------------------------------------------------------------- |
| Meal catalogs (Nigeria, US) | Draft and **inactive**; not shown until a qualified dietitian approves (#33) |
| Support resources           | **None active**; placeholders only, until verified and approved (#50)        |
| Safety values and wording   | Active on conservative defaults; clinical sign-off pending (#50)             |
| Privacy policy and Terms    | **Placeholders**; final text required before launch                          |

## 7. Questions for counsel

1. Does processing weight, cycle, pregnancy and postpartum data need explicit
   consent or extra disclosures under the Nigeria Data Protection Act 2023 and
   under US state health and reproductive-data laws (for example Washington's
   My Health My Data Act and similar state laws)?
2. Nigeria cross-border transfer: user data is stored in the Supabase hosting
   region (to be confirmed). What is required if that region is outside Nigeria?
3. How long should de-identified billing events and analytics events be kept,
   and should that be stated in the policy?
4. Is the 18+ self-confirmation sufficient, or is stronger age assurance
   expected?
5. Community: posts are visible to other Pro members once approved. What should
   the Terms say about user content, moderation and reporting?
6. Backups: how should Supabase backup retention (set by the hosting plan) be
   disclosed in relation to deletion requests?
7. Does BLOOM need a data protection officer, or registration with the Nigeria
   Data Protection Commission?

## 8. Fixes made while preparing this inventory (#57)

- **Export completeness.** The export previously left out reactions, reports,
  blocks, image metadata, subscription status, analytics and crash records. It
  now covers everything linked to the user and never reveals staff identities
  (database test `0020`).
- **Staff account deletion.** A moderator or reviewer who had acted could not
  delete their account. They now can, and their actions remain in the audit
  trail, de-identified (database test `0020`).
