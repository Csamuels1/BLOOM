-- Phase 13, issue #57: data-practices fixes found by the legal/privacy inventory.
--
-- 1. Complete data export (right of access). export_current_user previously
--    returned only the profile, weight, cycle and authored posts. It now returns
--    everything linked to the caller: image metadata, reactions, reports they
--    filed, members they blocked, their subscription status, and their own
--    analytics and crash records.
--
--    Analytics and crash tables are deliberately NOT client-readable, so the
--    function becomes SECURITY DEFINER (a security review item, see
--    SECURITY_PATCHES). Every query is filtered to the caller's own id; there is
--    no parameter, a call without a signed-in user is refused, and staff
--    identities (reviewed_by) are never included.
--
-- 2. Staff account deletion. moderation_actions.moderator_id and reviewed_by on
--    meals, support_resources and post_media were NO ACTION, so a moderator or
--    reviewer who had acted could not delete their account. They become
--    ON DELETE SET NULL. The audit history is kept, de-identified ("a deleted
--    staff account"), and the account and its personal data can be removed.

-- ---------------------------------------------------------------------------
-- 1. Complete export
-- ---------------------------------------------------------------------------
create or replace function public.export_current_user()
returns jsonb
language plpgsql
security definer
stable
set search_path = ''
as $$
declare
  uid uuid := (select auth.uid());
begin
  if uid is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;

  return jsonb_build_object(
    'exported_at', now(),
    'profile', (select to_jsonb(p) from public.profiles p where p.id = uid),
    'weight_measurements', coalesce(
      (select jsonb_agg(to_jsonb(w) order by w.measured_at)
         from public.weight_measurements w where w.user_id = uid), '[]'::jsonb),
    'cycle_logs', coalesce(
      (select jsonb_agg(to_jsonb(c) order by c.started_on)
         from public.cycle_logs c where c.user_id = uid), '[]'::jsonb),
    'community_posts', coalesce(
      (select jsonb_agg(to_jsonb(cp) order by cp.created_at)
         from public.community_posts cp where cp.author_id = uid), '[]'::jsonb),
    -- Image metadata only (the files themselves are downloadable in the app);
    -- the reviewing moderator's identity is never exported.
    'post_media', coalesce(
      (select jsonb_agg(jsonb_build_object(
          'id', m.id, 'post_id', m.post_id, 'storage_path', m.storage_path,
          'mime_type', m.mime_type, 'size_bytes', m.size_bytes,
          'status', m.status, 'created_at', m.created_at) order by m.created_at)
         from public.post_media m where m.author_id = uid), '[]'::jsonb),
    'post_reactions', coalesce(
      (select jsonb_agg(jsonb_build_object(
          'post_id', r.post_id, 'reaction', r.reaction,
          'created_at', r.created_at) order by r.created_at)
         from public.post_reactions r where r.user_id = uid), '[]'::jsonb),
    'post_reports', coalesce(
      (select jsonb_agg(jsonb_build_object(
          'post_id', rp.post_id, 'reason', rp.reason, 'details', rp.details,
          'status', rp.status, 'created_at', rp.created_at) order by rp.created_at)
         from public.post_reports rp where rp.reporter_id = uid), '[]'::jsonb),
    'user_blocks', coalesce(
      (select jsonb_agg(jsonb_build_object(
          'blocked_id', b.blocked_id, 'created_at', b.created_at) order by b.created_at)
         from public.user_blocks b where b.blocker_id = uid), '[]'::jsonb),
    'subscription', (
      select jsonb_build_object(
        'tier', s.tier, 'status', s.status, 'source', s.source,
        'current_period_end', s.current_period_end)
      from public.subscriptions s where s.user_id = uid),
    'analytics_events', coalesce(
      (select jsonb_agg(jsonb_build_object(
          'event_name', e.event_name, 'occurred_at', e.occurred_at) order by e.occurred_at)
         from public.analytics_events e where e.user_id = uid), '[]'::jsonb),
    'crash_reports', coalesce(
      (select jsonb_agg(jsonb_build_object(
          'error_name', cr.error_name, 'message', cr.message, 'stack', cr.stack,
          'app_version', cr.app_version, 'platform', cr.platform,
          'occurred_at', cr.occurred_at) order by cr.occurred_at)
         from public.client_crash_reports cr where cr.user_id = uid), '[]'::jsonb)
  );
end;
$$;

comment on function public.export_current_user() is
  'Return ALL of the caller''s own data as JSON (right of access). SECURITY DEFINER: every query is filtered to auth.uid(); no parameters; staff identities excluded.';

revoke execute on function public.export_current_user() from public, anon;
grant execute on function public.export_current_user() to authenticated;

-- ---------------------------------------------------------------------------
-- 2. Staff references: keep history, allow account deletion
-- ---------------------------------------------------------------------------
alter table public.moderation_actions alter column moderator_id drop not null;

alter table public.moderation_actions
  drop constraint moderation_actions_moderator_id_fkey,
  add constraint moderation_actions_moderator_id_fkey
    foreign key (moderator_id) references auth.users (id) on delete set null;

alter table public.meals
  drop constraint meals_reviewed_by_fkey,
  add constraint meals_reviewed_by_fkey
    foreign key (reviewed_by) references auth.users (id) on delete set null;

alter table public.support_resources
  drop constraint support_resources_reviewed_by_fkey,
  add constraint support_resources_reviewed_by_fkey
    foreign key (reviewed_by) references auth.users (id) on delete set null;

alter table public.post_media
  drop constraint post_media_reviewed_by_fkey,
  add constraint post_media_reviewed_by_fkey
    foreign key (reviewed_by) references auth.users (id) on delete set null;
