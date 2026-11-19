-- Phase 11, issue #49: a shown support resource must carry a review date.
--
-- Resources are only visible to members when is_active AND verified
-- (resources_select_active, #19). This adds the companion freshness/provenance
-- rule: an active resource must also record reviewed_at, so every resource a
-- member can see carries the date it was last reviewed. Combined with the
-- per-release reverification process (docs/operations/SUPPORT_RESOURCES.md), this
-- keeps shown resources dated and auditable; stale or undated entries cannot be
-- active.
alter table public.support_resources
  add constraint support_resources_active_requires_review
    check (not is_active or reviewed_at is not null);
