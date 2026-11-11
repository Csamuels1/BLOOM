-- Phase 4 exit gate (issue #21): resolve database advisors.
--
-- Running the Supabase security and performance advisors against the
-- reconstructed schema surfaced two classes of finding, fixed here:
--
--   1. function_search_path_mutable (security): public.is_moderator and
--      public.set_updated_at inherited the caller's search_path. For a
--      function used inside RLS policies (is_moderator gates staff access)
--      a mutable search_path is a privilege-escalation surface. Both bodies
--      reference only schema-qualified objects (auth.jwt()) or pg_catalog
--      built-ins (now()), so pinning search_path to '' is safe and removes
--      the finding. The account-lifecycle functions already pin search_path.
--
--   2. unindexed_foreign_keys (performance): the reviewed_by / moderator_id
--      staff foreign keys had no covering index, so a referential check or a
--      cascade on auth.users deletion would seq-scan. Low traffic, but the
--      advisor flags them; indexes are cheap and make the advisors clean.
--
-- No behavioural change: name resolution and query results are identical.

-- ---------------------------------------------------------------------------
-- 1. Pin search_path on the remaining public functions.
-- ---------------------------------------------------------------------------
alter function public.is_moderator() set search_path = '';
alter function public.set_updated_at() set search_path = '';

-- ---------------------------------------------------------------------------
-- 2. Cover the staff foreign keys with indexes.
-- ---------------------------------------------------------------------------
create index if not exists meals_reviewed_by_idx
  on public.meals (reviewed_by);
create index if not exists support_resources_reviewed_by_idx
  on public.support_resources (reviewed_by);
create index if not exists moderation_actions_moderator_idx
  on public.moderation_actions (moderator_id);
