-- Community security matrix (issue #119, Phase 9 prerequisite).
-- A = Pro member, B = free member, C = moderator, D = Pro member who blocked A.
-- Proves Pro-gated posting/reactions, block enforcement, reporter privacy,
-- moderator-only audited transitions, that authors cannot restore removed
-- content, and that pending media stays private until approved.
begin;
select plan(22);

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
  ('aaaaaaaa-0000-0000-0000-000000000001', 'authenticated', 'authenticated', 'a@t.local'),
  ('aaaaaaaa-0000-0000-0000-000000000002', 'authenticated', 'authenticated', 'b@t.local'),
  ('aaaaaaaa-0000-0000-0000-000000000003', 'authenticated', 'authenticated', 'c@t.local'),
  ('aaaaaaaa-0000-0000-0000-000000000004', 'authenticated', 'authenticated', 'd@t.local');
insert into public.subscriptions (user_id, tier, status) values
  ('aaaaaaaa-0000-0000-0000-000000000001', 'pro', 'active'),
  ('aaaaaaaa-0000-0000-0000-000000000004', 'pro', 'active');
insert into public.community_posts (id, author_id, body, status, space) values
  ('11111111-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', 'A approved', 'approved', 'recovery'),
  ('11111111-0000-0000-0000-000000000002', 'aaaaaaaa-0000-0000-0000-000000000002', 'B pending', 'pending', 'recovery'),
  ('11111111-0000-0000-0000-000000000003', 'aaaaaaaa-0000-0000-0000-000000000002', 'B approved', 'approved', 'gentle_loss');
insert into public.user_blocks (blocker_id, blocked_id) values
  ('aaaaaaaa-0000-0000-0000-000000000004', 'aaaaaaaa-0000-0000-0000-000000000001');
insert into public.post_reports (id, post_id, reporter_id, reason) values
  ('22222222-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000002', 'spam');

-- Posting: Pro only.
select pg_temp.login('aaaaaaaa-0000-0000-0000-000000000001');
select lives_ok(
  $$insert into public.community_posts (id, author_id, body, space)
    values ('11111111-0000-0000-0000-000000000004', 'aaaaaaaa-0000-0000-0000-000000000001', 'A new', 'recovery')$$,
  'a Pro member can post (pending)');

select pg_temp.login('aaaaaaaa-0000-0000-0000-000000000002');
select throws_ok(
  $$insert into public.community_posts (author_id, body, space)
    values ('aaaaaaaa-0000-0000-0000-000000000002', 'B new', 'recovery')$$,
  '42501', null, 'a free member cannot post');

select pg_temp.logout();
select throws_ok(
  $$insert into public.community_posts (author_id, body, space)
    values ('aaaaaaaa-0000-0000-0000-000000000001', 'x', 'elsewhere')$$,
  '23514', null, 'a post must belong to a known space');

-- Reactions: Pro only, approved posts only, never across a block.
select pg_temp.login('aaaaaaaa-0000-0000-0000-000000000001');
select lives_ok(
  $$insert into public.post_reactions (post_id, user_id)
    values ('11111111-0000-0000-0000-000000000003', 'aaaaaaaa-0000-0000-0000-000000000001')$$,
  'a Pro member can support an approved post');

select pg_temp.login('aaaaaaaa-0000-0000-0000-000000000002');
select throws_ok(
  $$insert into public.post_reactions (post_id, user_id)
    values ('11111111-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000002')$$,
  '42501', null, 'a free member cannot react');

select pg_temp.login('aaaaaaaa-0000-0000-0000-000000000001');
select throws_ok(
  $$insert into public.post_reactions (post_id, user_id)
    values ('11111111-0000-0000-0000-000000000002', 'aaaaaaaa-0000-0000-0000-000000000001')$$,
  '42501', null, 'nobody can react to a pending post');

select pg_temp.login('aaaaaaaa-0000-0000-0000-000000000004');
select throws_ok(
  $$insert into public.post_reactions (post_id, user_id)
    values ('11111111-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000004')$$,
  '42501', null, 'a block prevents reacting across it');

-- Reporter identity is protected from the reported author.
select pg_temp.login('aaaaaaaa-0000-0000-0000-000000000001');
select is(
  (select count(*)::int from public.post_reports where id = '22222222-0000-0000-0000-000000000001'),
  0, 'the reported author cannot see the report or its reporter');

-- Moderation transitions: moderator only, always audited.
select pg_temp.login('aaaaaaaa-0000-0000-0000-000000000002');
select throws_ok(
  $$select public.moderate_post('11111111-0000-0000-0000-000000000002', 'approve')$$,
  '42501', null, 'a non-moderator cannot moderate');

select pg_temp.login('aaaaaaaa-0000-0000-0000-000000000003', true);
select is(
  public.moderate_post('11111111-0000-0000-0000-000000000002', 'approve'),
  'approved', 'a moderator can approve a post');

select pg_temp.logout();
select is(
  (select count(*)::int from public.moderation_actions
     where target_id = '11111111-0000-0000-0000-000000000002' and action = 'approve'),
  1, 'the approval is recorded in the audit history');

-- Direct staff updates no longer bypass the audited function.
select pg_temp.login('aaaaaaaa-0000-0000-0000-000000000003', true);
update public.community_posts set status = 'removed'
  where id = '11111111-0000-0000-0000-000000000002';
select pg_temp.logout();
select is(
  (select status from public.community_posts where id = '11111111-0000-0000-0000-000000000002'),
  'approved', 'a direct staff update cannot change status (must use the audited function)');

-- An author cannot restore removed content.
select pg_temp.login('aaaaaaaa-0000-0000-0000-000000000003', true);
select public.moderate_post('11111111-0000-0000-0000-000000000001', 'remove', 'test');
select pg_temp.login('aaaaaaaa-0000-0000-0000-000000000001');
update public.community_posts set status = 'approved'
  where id = '11111111-0000-0000-0000-000000000001';
select pg_temp.logout();
select is(
  (select status from public.community_posts where id = '11111111-0000-0000-0000-000000000001'),
  'removed', 'an author cannot restore removed content');

-- Media: pending and private to the author until approved.
select pg_temp.login('aaaaaaaa-0000-0000-0000-000000000001');
select lives_ok(
  $$insert into public.post_media (id, post_id, author_id, storage_path, mime_type, size_bytes)
    values ('33333333-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000004',
            'aaaaaaaa-0000-0000-0000-000000000001',
            'aaaaaaaa-0000-0000-0000-000000000001/x.jpg', 'image/jpeg', 1000)$$,
  'an author can attach pending media to their own post');

select throws_ok(
  $$insert into public.post_media (post_id, author_id, storage_path, mime_type, size_bytes)
    values ('11111111-0000-0000-0000-000000000004', 'aaaaaaaa-0000-0000-0000-000000000001',
            'aaaaaaaa-0000-0000-0000-000000000002/y.jpg', 'image/jpeg', 1000)$$,
  '23514', null, 'media must live under the author''s own folder');

select pg_temp.login('aaaaaaaa-0000-0000-0000-000000000002');
select is(
  (select count(*)::int from public.post_media where id = '33333333-0000-0000-0000-000000000001'),
  0, 'another member cannot see pending media');

select pg_temp.login('aaaaaaaa-0000-0000-0000-000000000001');
select throws_ok(
  $$update public.post_media set status = 'approved'
    where id = '33333333-0000-0000-0000-000000000001'$$,
  '42501', null, 'an author cannot approve their own media');

select pg_temp.logout();
insert into storage.objects (bucket_id, name)
  values ('community-images', 'aaaaaaaa-0000-0000-0000-000000000001/x.jpg');
select pg_temp.login('aaaaaaaa-0000-0000-0000-000000000002');
select is(
  (select count(*)::int from storage.objects
     where name = 'aaaaaaaa-0000-0000-0000-000000000001/x.jpg'),
  0, 'the stored image is private while pending');

select pg_temp.login('aaaaaaaa-0000-0000-0000-000000000003', true);
select public.moderate_media('33333333-0000-0000-0000-000000000001', 'approve');
select public.moderate_post('11111111-0000-0000-0000-000000000004', 'approve');
select pg_temp.login('aaaaaaaa-0000-0000-0000-000000000002');
select is(
  (select count(*)::int from public.post_media where id = '33333333-0000-0000-0000-000000000001'),
  1, 'approved media on an approved post becomes visible');
select is(
  (select count(*)::int from storage.objects
     where name = 'aaaaaaaa-0000-0000-0000-000000000001/x.jpg'),
  1, 'the approved image becomes readable for signed-URL display');

-- Report review: moderator only, audited.
select pg_temp.login('aaaaaaaa-0000-0000-0000-000000000003', true);
select is(
  public.review_report('22222222-0000-0000-0000-000000000001', 'resolve_report'),
  'resolved', 'a moderator can resolve a report');

select pg_temp.login('aaaaaaaa-0000-0000-0000-000000000002');
select throws_ok(
  $$select public.review_report('22222222-0000-0000-0000-000000000001', 'dismiss_report')$$,
  '42501', null, 'a non-moderator cannot review reports');

select * from finish();
rollback;
