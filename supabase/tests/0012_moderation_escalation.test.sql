-- Moderation privilege-escalation audit (issue #41).
--
-- Proves the web moderation queue's authorization is enforced by the server, so
-- a non-moderator who reaches the staff surface (or calls the API directly) can
-- neither read the queue nor act on it:
--   U = ordinary Pro member (no moderator claim)
--   M = moderator (role in immutable app_metadata)
--   A = an author whose post is reported and has pending media
-- Non-moderators are refused on every read and every RPC; the moderator's
-- actions succeed and each writes an audit row.
begin;
select plan(13);

create function pg_temp.login(uid uuid, moderator boolean default false)
returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims',
    json_build_object(
      'sub', uid::text,
      'role', 'authenticated',
      'app_metadata',
        case when moderator then jsonb_build_object('role', 'moderator')
             else '{}'::jsonb end
    )::text, true);
  perform set_config('role', 'authenticated', true);
end $$;

create function pg_temp.logout() returns void language plpgsql as $$
begin
  perform set_config('role', 'postgres', true);
  perform set_config('request.jwt.claims', '', true);
end $$;

-- Seed as superuser (RLS bypassed).
insert into auth.users (id, aud, role, email) values
  ('cccccccc-0000-0000-0000-00000000000a', 'authenticated', 'authenticated', 'author@t.local'),
  ('cccccccc-0000-0000-0000-00000000000b', 'authenticated', 'authenticated', 'user@t.local'),
  ('cccccccc-0000-0000-0000-00000000000c', 'authenticated', 'authenticated', 'mod@t.local');

insert into public.community_posts (id, author_id, body, status, space) values
  ('dddddddd-0000-0000-0000-000000000001', 'cccccccc-0000-0000-0000-00000000000a',
   'reported post', 'approved', 'recovery');

insert into public.post_reports (id, post_id, reporter_id, reason) values
  ('eeeeeeee-0000-0000-0000-000000000001', 'dddddddd-0000-0000-0000-000000000001',
   'cccccccc-0000-0000-0000-00000000000b', 'harassment');

insert into public.post_media (id, post_id, author_id, mime_type, size_bytes, status, storage_path) values
  ('ffffffff-0000-0000-0000-000000000001', 'dddddddd-0000-0000-0000-000000000001',
   'cccccccc-0000-0000-0000-00000000000a', 'image/jpeg', 2048, 'pending',
   'cccccccc-0000-0000-0000-00000000000a/pending.jpg');

-- ---------------------------------------------------------------------------
-- A non-moderator (the reporting member) is refused everywhere.
-- ---------------------------------------------------------------------------
select pg_temp.login('cccccccc-0000-0000-0000-00000000000b');

select is(public.is_moderator(), false, 'an ordinary member is not a moderator');

select throws_ok(
  $$select public.moderate_post('dddddddd-0000-0000-0000-000000000001', 'remove')$$,
  '42501', null, 'a non-moderator cannot moderate a post');

select throws_ok(
  $$select public.moderate_media('ffffffff-0000-0000-0000-000000000001', 'approve')$$,
  '42501', null, 'a non-moderator cannot moderate media');

select throws_ok(
  $$select public.review_report('eeeeeeee-0000-0000-0000-000000000001', 'resolve_report')$$,
  '42501', null, 'a non-moderator cannot review a report');

-- Their own report is the one they filed; they cannot see it as a queue (they
-- only ever see their own, and here that is exactly one — but never others').
-- A different member sees zero of the reports they did not file.
select pg_temp.login('cccccccc-0000-0000-0000-00000000000a');
select is(
  (select count(*)::int from public.post_reports),
  0,
  'a member cannot read reports they did not file');

select is(
  (select count(*)::int from public.moderation_actions),
  0,
  'a non-moderator cannot read the moderation audit');

select throws_ok(
  $$insert into public.moderation_actions (moderator_id, target_type, target_id, action)
    values ('cccccccc-0000-0000-0000-00000000000a', 'post',
            'dddddddd-0000-0000-0000-000000000001', 'remove')$$,
  '42501', null, 'a non-moderator cannot write the moderation audit directly');

-- ---------------------------------------------------------------------------
-- A moderator can read the queue and act; each action is audited.
-- ---------------------------------------------------------------------------
select pg_temp.login('cccccccc-0000-0000-0000-00000000000c', true);

select is(public.is_moderator(), true, 'a moderator is recognised by the server');

select is(
  (select count(*)::int from public.post_reports
   where id = 'eeeeeeee-0000-0000-0000-000000000001'),
  1,
  'a moderator can read the report queue');

select lives_ok(
  $$select public.review_report('eeeeeeee-0000-0000-0000-000000000001', 'start_review')$$,
  'a moderator can start a report review');

select lives_ok(
  $$select public.moderate_media('ffffffff-0000-0000-0000-000000000001', 'approve')$$,
  'a moderator can approve pending media');

select is(
  public.moderate_post('dddddddd-0000-0000-0000-000000000001', 'remove'),
  'removed',
  'a moderator can remove a post');

select is(
  (select count(*)::int from public.moderation_actions
   where moderator_id = 'cccccccc-0000-0000-0000-00000000000c'),
  3,
  'every moderator action wrote exactly one audit row');

select pg_temp.logout();
select * from finish();
rollback;
