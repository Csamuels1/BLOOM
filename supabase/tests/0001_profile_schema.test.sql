-- pgTAP constraint tests for the profile/measurement/cycle schema (issue #17).
-- Run with `npm run test:db` (supabase test db) against a fresh local reset.
begin;
select plan(14);

-- A user to own rows (satisfies the auth.users foreign key).
insert into auth.users (id, aud, role, email)
values (
  '11111111-1111-1111-1111-111111111111',
  'authenticated',
  'authenticated',
  'owner@test.local'
);

-- Tables exist.
select has_table('public', 'profiles', 'profiles table exists');
select has_table('public', 'weight_measurements', 'weight_measurements exists');
select has_table('public', 'cycle_logs', 'cycle_logs table exists');

-- RLS is enabled (deny-by-default until policies land in #19).
select is(
  (select relrowsecurity from pg_class where oid = 'public.profiles'::regclass),
  true, 'profiles has RLS enabled');
select is(
  (select relrowsecurity from pg_class where oid = 'public.weight_measurements'::regclass),
  true, 'weight_measurements has RLS enabled');
select is(
  (select relrowsecurity from pg_class where oid = 'public.cycle_logs'::regclass),
  true, 'cycle_logs has RLS enabled');

-- A valid profile inserts.
select lives_ok(
  $$insert into public.profiles (id, goal, height_cm, country_code, unit_system)
    values ('11111111-1111-1111-1111-111111111111', 'maintenance', 165, 'NG', 'metric')$$,
  'a valid profile inserts');

-- Ownership: a profile requires an existing auth user.
select throws_ok(
  $$insert into public.profiles (id, goal)
    values ('99999999-9999-9999-9999-999999999999', 'loss')$$,
  '23503', null, 'profile requires an existing auth user');

-- Value guards (check constraints, SQLSTATE 23514).
select throws_ok(
  $$insert into public.profiles (id, goal)
    values ('11111111-1111-1111-1111-111111111111', 'bulk')$$,
  '23514', null, 'an invalid goal is rejected');
select throws_ok(
  $$update public.profiles set height_cm = 300
    where id = '11111111-1111-1111-1111-111111111111'$$,
  '23514', null, 'an out-of-range height is rejected');
select throws_ok(
  $$update public.profiles
      set postpartum_months = 5, postpartum_status = 'not_postpartum'
    where id = '11111111-1111-1111-1111-111111111111'$$,
  '23514', null, 'postpartum months require a postpartum status');
select throws_ok(
  $$insert into public.weight_measurements (user_id, weight_kg)
    values ('11111111-1111-1111-1111-111111111111', 0)$$,
  '23514', null, 'a non-positive weight is rejected');

-- Uniqueness: one cycle entry per start date per user.
select lives_ok(
  $$insert into public.cycle_logs (user_id, started_on)
    values ('11111111-1111-1111-1111-111111111111', '2026-01-01')$$,
  'a first cycle entry inserts');
select throws_ok(
  $$insert into public.cycle_logs (user_id, started_on)
    values ('11111111-1111-1111-1111-111111111111', '2026-01-01')$$,
  '23505', null, 'a duplicate cycle start is rejected');

select * from finish();
rollback;
