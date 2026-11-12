-- Two-user privacy for private progress photos (issue #27, verified at the
-- Phase 6 gate #28). The `progress-photos` bucket is private and its Storage
-- policy `progress_photos_rw_own` scopes objects to the owner by path prefix
-- (the first folder segment must equal auth.uid()). This exercises that policy
-- with two users: a user may write and read only under their own prefix, and
-- can neither write into nor read another user's space.
--
-- Note: direct DELETE from storage.objects is blocked by a Storage trigger for
-- everyone (the client uses the Storage API), so deletion is not tested here;
-- the ownership-critical insert (with check) and select (using) paths are.
begin;
select plan(4);

create function pg_temp.login(uid uuid) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims',
    json_build_object('sub', uid::text, 'role', 'authenticated',
      'app_metadata', '{}'::jsonb)::text, true);
  perform set_config('role', 'authenticated', true);
end $$;

-- Two users (RLS bypassed as superuser while seeding).
insert into auth.users (id, aud, role, email) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'authenticated', 'authenticated', 'a@t.local'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'authenticated', 'authenticated', 'b@t.local');

-- Seed user B's private object directly (as superuser, bypassing RLS).
insert into storage.objects (bucket_id, name)
  values ('progress-photos', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb/b.jpg');

-- Act as user A.
select pg_temp.login('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa');

select lives_ok(
  $$insert into storage.objects (bucket_id, name)
    values ('progress-photos', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa/a.jpg')$$,
  'a user can upload under their own prefix');

select throws_ok(
  $$insert into storage.objects (bucket_id, name)
    values ('progress-photos', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb/x.jpg')$$,
  '42501', null,
  'a user cannot upload into another user''s prefix');

select is(
  (select count(*) from storage.objects
     where bucket_id = 'progress-photos'
       and name like 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa/%')::int,
  1,
  'a user can see their own objects');

select is(
  (select count(*) from storage.objects
     where bucket_id = 'progress-photos'
       and name like 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb/%')::int,
  0,
  'a user cannot see another user''s objects');

select * from finish();
rollback;
