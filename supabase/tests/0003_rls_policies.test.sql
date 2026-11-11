-- pgTAP authorization-matrix tests for RLS policies (issue #19).
-- Simulates authenticated users (and a moderator via app_metadata) and checks
-- allowed vs denied for owners, other users, and staff. Run with `npm run test:db`.
begin;
select plan(18);

-- Helpers to switch the auth context within the test transaction.
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

-- Seed data as the superuser (RLS bypassed).
insert into auth.users (id, aud, role, email) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'authenticated', 'authenticated', 'a@t.local'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'authenticated', 'authenticated', 'b@t.local'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'authenticated', 'authenticated', 'c@t.local'),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'authenticated', 'authenticated', 'mod@t.local');
insert into public.profiles (id, goal) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'loss'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'gain');
insert into public.subscriptions (user_id, tier) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'pro');
insert into public.community_posts (id, author_id, body, status) values
  ('11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'pending post', 'pending'),
  ('22222222-2222-2222-2222-222222222222', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'approved post', 'approved');
insert into public.post_reports (post_id, reporter_id, reason) values
  ('22222222-2222-2222-2222-222222222222', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'spam');

-- Profiles: a user sees only their own, and cannot create one for someone else.
select pg_temp.login('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa');
select is((select count(*) from public.profiles)::int, 1, 'owner sees only their own profile');
select is((select count(*) from public.profiles where id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb')::int, 0, 'owner cannot see another user profile');
select throws_ok(
  $$insert into public.profiles (id, goal) values ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'loss')$$,
  '42501', null, 'cannot insert a profile for another user');
select pg_temp.logout();

-- Weight: owner can log their own; cannot log for another user.
select pg_temp.login('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa');
select lives_ok(
  $$insert into public.weight_measurements (user_id, weight_kg) values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 70)$$,
  'owner can log their own weight');
select throws_ok(
  $$insert into public.weight_measurements (user_id, weight_kg) values ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 70)$$,
  '42501', null, 'cannot log weight for another user');
select pg_temp.logout();

-- Subscriptions: a user reads only their own entitlement.
select pg_temp.login('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa');
select is((select tier from public.subscriptions)::text, 'pro', 'owner reads their own entitlement');
select pg_temp.logout();
select pg_temp.login('cccccccc-cccc-cccc-cccc-cccccccccccc');
select is((select count(*) from public.subscriptions)::int, 0, 'a user cannot read another entitlement');
select pg_temp.logout();

-- Community: a non-author, non-staff user sees only approved posts.
select pg_temp.login('cccccccc-cccc-cccc-cccc-cccccccccccc');
select is((select count(*) from public.community_posts)::int, 1, 'other user sees only approved posts');
select is((select status from public.community_posts)::text, 'approved', 'the visible post is the approved one');
select throws_ok(
  $$insert into public.community_posts (author_id, body, status) values ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'x', 'approved')$$,
  '42501', null, 'a user cannot self-approve a post on insert');
select pg_temp.logout();

-- The author sees their own pending post; a moderator sees everything.
select pg_temp.login('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa');
select is((select count(*) from public.community_posts)::int, 2, 'author sees own pending plus approved');
select pg_temp.logout();
select pg_temp.login('dddddddd-dddd-dddd-dddd-dddddddddddd', true);
select is((select count(*) from public.community_posts)::int, 2, 'a moderator sees all posts');
select pg_temp.logout();

-- Reports: the reporter sees their own; another user sees none; staff see all.
select pg_temp.login('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa');
select is((select count(*) from public.post_reports)::int, 1, 'a reporter sees their own report');
select pg_temp.logout();
select pg_temp.login('cccccccc-cccc-cccc-cccc-cccccccccccc');
select is((select count(*) from public.post_reports)::int, 0, 'reporter identity is hidden from other users');
select pg_temp.logout();
select pg_temp.login('dddddddd-dddd-dddd-dddd-dddddddddddd', true);
select is((select count(*) from public.post_reports)::int, 1, 'a moderator can review reports');
select pg_temp.logout();

-- Analytics: a user may record their own event but can never read events back.
select pg_temp.login('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa');
select lives_ok(
  $$insert into public.analytics_events (event_name, user_id) values ('weight_logged', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa')$$,
  'a user can record their own analytics event');
select is((select count(*) from public.analytics_events)::int, 0, 'a user cannot read analytics events');
select pg_temp.logout();

-- Moderation audit: staff-only writes.
select pg_temp.login('cccccccc-cccc-cccc-cccc-cccccccccccc');
select throws_ok(
  $$insert into public.moderation_actions (moderator_id, target_type, target_id, action)
    values ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'post', '22222222-2222-2222-2222-222222222222', 'remove')$$,
  '42501', null, 'a non-moderator cannot write moderation actions');
select pg_temp.logout();

select * from finish();
rollback;
