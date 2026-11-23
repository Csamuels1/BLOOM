-- Phase 13, issue #55: resolve the release-candidate performance advisor finding
-- `multiple_permissive_policies` on public.meals and public.support_resources.
--
-- Each table had two permissive SELECT policies for `authenticated` (an
-- "active rows" policy and a "staff" policy), so Postgres evaluated both for
-- every query. They are merged into one policy per table with IDENTICAL access:
--   - members see only active, approved/verified rows;
--   - moderators (immutable app_metadata role, is_moderator()) see all rows.
-- The auth helper stays wrapped in (select ...) so it is evaluated once per
-- statement (advisor invariant, pgTAP 0005).

drop policy "meals_select_active" on public.meals;
drop policy "meals_select_staff" on public.meals;

create policy "meals_select" on public.meals
  for select to authenticated
  using (
    (is_active and review_status = 'approved')
    or (select public.is_moderator())
  );

drop policy "resources_select_active" on public.support_resources;
drop policy "resources_select_staff" on public.support_resources;

create policy "resources_select" on public.support_resources
  for select to authenticated
  using (
    (is_active and verified)
    or (select public.is_moderator())
  );
