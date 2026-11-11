-- Phase 4, issue #19: grants, operation-specific RLS policies, and private
-- Storage policies.
--
-- RLS is already enabled (deny-by-default) on every table from #17/#18. This
-- migration adds table privileges and per-operation policies with ownership
-- checks, plus private Storage buckets. Staff authorization comes from the
-- immutable app_metadata claim, never user-editable fields (SECURITY_BASELINE).

-- Staff check: reads the role from the JWT's app_metadata (set server-side).
create or replace function public.is_moderator()
returns boolean
language sql
stable
as $$
  select coalesce(
    (auth.jwt() -> 'app_metadata' ->> 'role') in ('moderator', 'admin'),
    false
  );
$$;

comment on function public.is_moderator() is
  'True when the caller has a moderator/admin role in immutable app_metadata.';

-- ---------------------------------------------------------------------------
-- Private per-user data: owner-only on every operation.
-- ---------------------------------------------------------------------------
grant select, insert, update, delete on public.profiles to authenticated;

create policy "profiles_select_own" on public.profiles
  for select to authenticated using (id = (select auth.uid()));
create policy "profiles_insert_own" on public.profiles
  for insert to authenticated with check (id = (select auth.uid()));
create policy "profiles_update_own" on public.profiles
  for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));
create policy "profiles_delete_own" on public.profiles
  for delete to authenticated using (id = (select auth.uid()));

grant select, insert, update, delete on public.weight_measurements to authenticated;

create policy "weight_select_own" on public.weight_measurements
  for select to authenticated using (user_id = (select auth.uid()));
create policy "weight_insert_own" on public.weight_measurements
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "weight_update_own" on public.weight_measurements
  for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "weight_delete_own" on public.weight_measurements
  for delete to authenticated using (user_id = (select auth.uid()));

grant select, insert, update, delete on public.cycle_logs to authenticated;

create policy "cycle_select_own" on public.cycle_logs
  for select to authenticated using (user_id = (select auth.uid()));
create policy "cycle_insert_own" on public.cycle_logs
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "cycle_update_own" on public.cycle_logs
  for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "cycle_delete_own" on public.cycle_logs
  for delete to authenticated using (user_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- Read-only catalogs: only approved/verified content is visible; staff see all.
-- Writes happen through the service role (which bypasses RLS).
-- ---------------------------------------------------------------------------
grant select on public.meals to authenticated;

create policy "meals_select_active" on public.meals
  for select to authenticated
  using (is_active and review_status = 'approved');
create policy "meals_select_staff" on public.meals
  for select to authenticated using ((select public.is_moderator()));

grant select on public.support_resources to authenticated;

create policy "resources_select_active" on public.support_resources
  for select to authenticated using (is_active and verified);
create policy "resources_select_staff" on public.support_resources
  for select to authenticated using ((select public.is_moderator()));

-- ---------------------------------------------------------------------------
-- Entitlements: a user reads only their own row; writes are server-side.
-- ---------------------------------------------------------------------------
grant select on public.subscriptions to authenticated;

create policy "subscriptions_select_own" on public.subscriptions
  for select to authenticated using (user_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- Community posts: approved posts are visible to all; authors see their own;
-- staff see everything. Blocked pairs are hidden. Authors may only edit while
-- pending; only staff can change moderation status.
-- ---------------------------------------------------------------------------
grant select, insert, update, delete on public.community_posts to authenticated;

create policy "posts_select" on public.community_posts
  for select to authenticated using (
    (
      status = 'approved'
      or author_id = (select auth.uid())
      or (select public.is_moderator())
    )
    and not exists (
      select 1 from public.user_blocks b
      where (b.blocker_id = (select auth.uid()) and b.blocked_id = author_id)
         or (b.blocker_id = author_id and b.blocked_id = (select auth.uid()))
    )
  );
create policy "posts_insert_own" on public.community_posts
  for insert to authenticated
  with check (author_id = (select auth.uid()) and status = 'pending');
create policy "posts_update_author" on public.community_posts
  for update to authenticated
  using (author_id = (select auth.uid()) and status = 'pending')
  with check (author_id = (select auth.uid()) and status = 'pending');
create policy "posts_update_staff" on public.community_posts
  for update to authenticated
  using ((select public.is_moderator())) with check ((select public.is_moderator()));
create policy "posts_delete" on public.community_posts
  for delete to authenticated
  using (author_id = (select auth.uid()) or (select public.is_moderator()));

-- Support reactions: visible on posts the user can see; a user owns its own.
grant select, insert, delete on public.post_reactions to authenticated;

create policy "reactions_select" on public.post_reactions
  for select to authenticated using (
    exists (
      select 1 from public.community_posts p
      where p.id = post_reactions.post_id
        and (
          p.status = 'approved'
          or p.author_id = (select auth.uid())
          or (select public.is_moderator())
        )
    )
  );
create policy "reactions_insert_own" on public.post_reactions
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "reactions_delete_own" on public.post_reactions
  for delete to authenticated using (user_id = (select auth.uid()));

-- Reports: a reporter sees only their own; staff see all. Reporter identity is
-- never exposed to the reported user. Only staff change status.
grant select, insert, update on public.post_reports to authenticated;

create policy "reports_select_own_or_staff" on public.post_reports
  for select to authenticated
  using (reporter_id = (select auth.uid()) or (select public.is_moderator()));
create policy "reports_insert_own" on public.post_reports
  for insert to authenticated with check (reporter_id = (select auth.uid()));
create policy "reports_update_staff" on public.post_reports
  for update to authenticated
  using ((select public.is_moderator())) with check ((select public.is_moderator()));

-- Blocks: entirely owned by the blocker.
grant select, insert, delete on public.user_blocks to authenticated;

create policy "blocks_select_own" on public.user_blocks
  for select to authenticated using (blocker_id = (select auth.uid()));
create policy "blocks_insert_own" on public.user_blocks
  for insert to authenticated with check (blocker_id = (select auth.uid()));
create policy "blocks_delete_own" on public.user_blocks
  for delete to authenticated using (blocker_id = (select auth.uid()));

-- Moderation audit: staff-only, and append-only (no update/delete policies).
grant select, insert on public.moderation_actions to authenticated;

create policy "moderation_select_staff" on public.moderation_actions
  for select to authenticated using ((select public.is_moderator()));
create policy "moderation_insert_staff" on public.moderation_actions
  for insert to authenticated
  with check ((select public.is_moderator()) and moderator_id = (select auth.uid()));

-- Analytics: the allowlist is readable; events are insert-only for the owner
-- and never selectable by clients.
grant select on public.analytics_event_types to authenticated;
grant insert on public.analytics_events to authenticated;

create policy "analytics_types_select" on public.analytics_event_types
  for select to authenticated using (true);
create policy "analytics_insert_own" on public.analytics_events
  for insert to authenticated with check (user_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- Private Storage: progress photos and community images stay private to their
-- owner (object path is prefixed with the owner's user id). Moderators may read
-- community images for review. Buckets are not public.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('progress-photos', 'progress-photos', false)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('community-images', 'community-images', false)
on conflict (id) do nothing;

create policy "progress_photos_rw_own" on storage.objects
  for all to authenticated
  using (
    bucket_id = 'progress-photos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  )
  with check (
    bucket_id = 'progress-photos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "community_images_rw_own" on storage.objects
  for all to authenticated
  using (
    bucket_id = 'community-images'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  )
  with check (
    bucket_id = 'community-images'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "community_images_read_staff" on storage.objects
  for select to authenticated
  using (bucket_id = 'community-images' and (select public.is_moderator()));
