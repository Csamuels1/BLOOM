-- Phase 9 prerequisite (issue #119): community spaces, Pro-gated posting,
-- pending media, and audited moderation.
--
-- Shared database groundwork for #38 (feeds + reactions), #39 (media), #40
-- (reports/blocks/moderation states) and #41 (web moderation queue).
--
-- Security model:
--  * Reading approved posts is free; posting and reacting require Pro, checked
--    on the server via public.is_pro() (the caller's own subscription row).
--  * Media starts pending and is private to its author and staff; only approved
--    media on an approved post is readable by others, via signed URLs.
--  * Every moderation transition goes through a moderator-checked function that
--    writes the audit row in the same transaction. The direct staff UPDATE
--    policies are removed so no transition can skip the audit.

-- ---------------------------------------------------------------------------
-- 1. Spaces: separate recovery and gentle-loss communities.
-- ---------------------------------------------------------------------------
alter table public.community_posts
  add column space text not null default 'recovery'
    check (space in ('recovery', 'gentle_loss'));

comment on column public.community_posts.space is
  'Which community the post belongs to: recovery or gentle_loss.';

create index community_posts_space_feed_idx
  on public.community_posts (space, status, created_at desc);

-- ---------------------------------------------------------------------------
-- 2. Pro entitlement check (server-side; the client never decides).
-- ---------------------------------------------------------------------------
create function public.is_pro()
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select exists (
    select 1
    from public.subscriptions s
    where s.user_id = (select auth.uid())
      and s.tier = 'pro'
      and s.status in ('active', 'in_grace')
  );
$$;

comment on function public.is_pro() is
  'True when the caller has an active (or in-grace) Pro subscription. Reads only the caller''s own row (RLS).';

revoke all on function public.is_pro() from public;
grant execute on function public.is_pro() to authenticated;

-- Posting requires Pro (still pending until a moderator approves).
drop policy "posts_insert_own" on public.community_posts;
create policy "posts_insert_own_pro" on public.community_posts
  for insert to authenticated
  with check (
    author_id = (select auth.uid())
    and status = 'pending'
    and (select public.is_pro())
  );

-- Status changes happen only through moderate_post() (audited); staff no
-- longer update posts directly.
drop policy "posts_update_staff" on public.community_posts;

-- Reactions: Pro only, approved posts only, never across a block.
drop policy "reactions_insert_own" on public.post_reactions;
create policy "reactions_insert_own_pro" on public.post_reactions
  for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and (select public.is_pro())
    and exists (
      select 1 from public.community_posts p
      where p.id = post_reactions.post_id
        and p.status = 'approved'
        and not exists (
          select 1 from public.user_blocks b
          where (b.blocker_id = (select auth.uid()) and b.blocked_id = p.author_id)
             or (b.blocker_id = p.author_id and b.blocked_id = (select auth.uid()))
        )
    )
  );

drop policy "reactions_select" on public.post_reactions;
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
        and not exists (
          select 1 from public.user_blocks b
          where (b.blocker_id = (select auth.uid()) and b.blocked_id = p.author_id)
             or (b.blocker_id = p.author_id and b.blocked_id = (select auth.uid()))
        )
    )
  );

-- Report status changes happen only through review_report() (audited).
drop policy "reports_update_staff" on public.post_reports;

-- ---------------------------------------------------------------------------
-- 3. Pending community media.
-- ---------------------------------------------------------------------------
create table public.post_media (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.community_posts (id) on delete cascade,
  author_id uuid not null references auth.users (id) on delete cascade,
  storage_path text not null unique,
  mime_type text not null check (mime_type in ('image/jpeg', 'image/png', 'image/webp')),
  size_bytes integer not null check (size_bytes between 1 and 5242880),
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected')),
  reviewed_by uuid references auth.users (id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  -- The object must live under the author's own folder in community-images.
  constraint post_media_path_owned
    check (split_part(storage_path, '/', 1) = author_id::text)
);

comment on table public.post_media is
  'Images attached to community posts. Pending and rejected media stay private to the author and staff.';

create index post_media_post_idx on public.post_media (post_id);
create index post_media_author_idx on public.post_media (author_id);
create index post_media_reviewed_by_idx on public.post_media (reviewed_by);
create index post_media_status_idx on public.post_media (status);

alter table public.post_media enable row level security;
-- Supabase default privileges grant everything on new tables; tighten to the
-- minimum. Status only changes via moderate_media(), so members get no UPDATE.
revoke all on public.post_media from anon;
revoke update on public.post_media from authenticated;
grant select, insert, delete on public.post_media to authenticated;

create policy "media_select" on public.post_media
  for select to authenticated using (
    author_id = (select auth.uid())
    or (select public.is_moderator())
    or (
      status = 'approved'
      and exists (
        select 1 from public.community_posts p
        where p.id = post_media.post_id
          and p.status = 'approved'
          and not exists (
            select 1 from public.user_blocks b
            where (b.blocker_id = (select auth.uid()) and b.blocked_id = p.author_id)
               or (b.blocker_id = p.author_id and b.blocked_id = (select auth.uid()))
          )
      )
    )
  );

create policy "media_insert_own" on public.post_media
  for insert to authenticated with check (
    author_id = (select auth.uid())
    and status = 'pending'
    and exists (
      select 1 from public.community_posts p
      where p.id = post_media.post_id and p.author_id = (select auth.uid())
    )
  );

create policy "media_delete_own_or_staff" on public.post_media
  for delete to authenticated using (
    author_id = (select auth.uid()) or (select public.is_moderator())
  );

-- Bucket-level validation as a second line of defence.
update storage.buckets
  set file_size_limit = 5242880,
      allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp']
  where id = 'community-images';

-- Others may read an object only when it is approved media on an approved post.
create policy "community_images_read_approved" on storage.objects
  for select to authenticated using (
    bucket_id = 'community-images'
    and exists (
      select 1
      from public.post_media m
      join public.community_posts p on p.id = m.post_id
      where m.storage_path = storage.objects.name
        and m.status = 'approved'
        and p.status = 'approved'
    )
  );

-- ---------------------------------------------------------------------------
-- 4. Audited moderation transitions.
-- ---------------------------------------------------------------------------
alter table public.moderation_actions
  drop constraint moderation_actions_target_type_check;
alter table public.moderation_actions
  add constraint moderation_actions_target_type_check
    check (target_type in ('post', 'user', 'report', 'media'));

alter table public.moderation_actions
  drop constraint moderation_actions_action_check;
alter table public.moderation_actions
  add constraint moderation_actions_action_check
    check (action in (
      'approve', 'remove', 'warn', 'block',
      'start_review', 'dismiss_report', 'resolve_report'
    ));

-- SECURITY DEFINER review item: each function refuses non-moderators, changes
-- exactly one row, and records the action in the same transaction.

create function public.moderate_post(p_post_id uuid, p_action text, p_reason text default null)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_status text;
begin
  if not public.is_moderator() then
    raise exception 'not authorized' using errcode = '42501';
  end if;
  new_status := case p_action when 'approve' then 'approved' when 'remove' then 'removed' end;
  if new_status is null then
    raise exception 'unknown action %', p_action using errcode = '22023';
  end if;

  update public.community_posts set status = new_status where id = p_post_id;
  if not found then
    raise exception 'post not found' using errcode = 'P0002';
  end if;

  insert into public.moderation_actions (moderator_id, target_type, target_id, action, reason)
  values ((select auth.uid()), 'post', p_post_id, p_action, p_reason);
  return new_status;
end;
$$;

create function public.moderate_media(p_media_id uuid, p_action text, p_reason text default null)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_status text;
begin
  if not public.is_moderator() then
    raise exception 'not authorized' using errcode = '42501';
  end if;
  new_status := case p_action when 'approve' then 'approved' when 'remove' then 'rejected' end;
  if new_status is null then
    raise exception 'unknown action %', p_action using errcode = '22023';
  end if;

  update public.post_media
    set status = new_status, reviewed_by = (select auth.uid()), reviewed_at = now()
    where id = p_media_id;
  if not found then
    raise exception 'media not found' using errcode = 'P0002';
  end if;

  insert into public.moderation_actions (moderator_id, target_type, target_id, action, reason)
  values ((select auth.uid()), 'media', p_media_id, p_action, p_reason);
  return new_status;
end;
$$;

create function public.review_report(p_report_id uuid, p_action text, p_reason text default null)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_status text;
begin
  if not public.is_moderator() then
    raise exception 'not authorized' using errcode = '42501';
  end if;
  new_status := case p_action
    when 'start_review' then 'reviewing'
    when 'resolve_report' then 'resolved'
    when 'dismiss_report' then 'dismissed'
  end;
  if new_status is null then
    raise exception 'unknown action %', p_action using errcode = '22023';
  end if;

  update public.post_reports set status = new_status where id = p_report_id;
  if not found then
    raise exception 'report not found' using errcode = 'P0002';
  end if;

  insert into public.moderation_actions (moderator_id, target_type, target_id, action, reason)
  values ((select auth.uid()), 'report', p_report_id, p_action, p_reason);
  return new_status;
end;
$$;

revoke all on function public.moderate_post(uuid, text, text) from public;
revoke all on function public.moderate_media(uuid, text, text) from public;
revoke all on function public.review_report(uuid, text, text) from public;
grant execute on function public.moderate_post(uuid, text, text) to authenticated;
grant execute on function public.moderate_media(uuid, text, text) to authenticated;
grant execute on function public.review_report(uuid, text, text) to authenticated;
