-- pgTAP tests for onboarding persistence and account lifecycle (issue #20).
-- Run with `npm run test:db`.
begin;
select plan(12);

create function pg_temp.login(uid uuid) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims',
    json_build_object('sub', uid::text, 'role', 'authenticated',
      'app_metadata', '{}'::jsonb)::text, true);
  perform set_config('role', 'authenticated', true);
end $$;

create function pg_temp.logout() returns void language plpgsql as $$
begin
  perform set_config('role', 'postgres', true);
  perform set_config('request.jwt.claims', '', true);
end $$;

insert into auth.users (id, aud, role, email) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'authenticated', 'authenticated', 'a@t.local'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'authenticated', 'authenticated', 'b@t.local');

-- persist_onboarding saves canonical values atomically to the caller's profile.
select pg_temp.login('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa');
select lives_ok(
  $$select public.persist_onboarding('{"goal":"loss","height_cm":"170","country_code":"NG","unit_system":"metric","dietary_preferences":["vegan"],"allergens":["peanut"],"track_cycle":true,"age_confirmed":true}'::jsonb)$$,
  'persist_onboarding saves the draft');
select is((select goal from public.profiles where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'), 'loss', 'goal is saved');
select is((select height_cm from public.profiles where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'), 170, 'canonical height (cm) is saved');
select is((select allergens from public.profiles where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'), '{peanut}'::text[], 'allergens are saved');
select ok(
  (select onboarding_completed_at is not null from public.profiles where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  'onboarding_completed_at is set');

-- Profile reloads and a re-persist updates it (upsert, not duplicate).
select is((select count(*) from public.profiles where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa')::int, 1, 'the profile reloads');
select lives_ok(
  $$select public.persist_onboarding('{"goal":"gain","unit_system":"metric","age_confirmed":true}'::jsonb)$$,
  're-persisting updates the same profile');
select is((select goal from public.profiles where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'), 'gain', 'the profile is updated, not duplicated');

-- Export returns the caller's own data only.
select is(
  jsonb_typeof(public.export_current_user() -> 'profile'), 'object',
  'export includes the caller profile');
select pg_temp.logout();

select pg_temp.login('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb');
select is(
  jsonb_typeof(public.export_current_user() -> 'profile'), 'null',
  'export excludes another user''s data');
select pg_temp.logout();

-- Deletion removes the account and cascades to owned rows.
select pg_temp.login('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa');
select lives_ok($$select public.delete_current_user()$$, 'delete_current_user runs');
select pg_temp.logout();
select is(
  (select count(*) from public.profiles where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa')::int,
  0, 'account deletion cascades to the profile');

select * from finish();
rollback;
