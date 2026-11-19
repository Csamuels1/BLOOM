-- Telemetry privacy (issue #53).
--
-- Crash reports: insert-only for the owner, never readable/updatable/deletable by
-- clients, strict schema, and scrubbed server-side even if a client didn't.
-- Analytics: only allowlisted event names, only for the caller.
begin;
select plan(15);

create function pg_temp.login(uid uuid)
returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims',
    json_build_object('sub', uid::text, 'role', 'authenticated',
      'app_metadata', '{}'::jsonb)::text, true);
  perform set_config('role', 'authenticated', true);
end $$;

create function pg_temp.anon() returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims', '{"role":"anon"}', true);
  perform set_config('role', 'anon', true);
end $$;

create function pg_temp.logout() returns void language plpgsql as $$
begin
  perform set_config('role', 'postgres', true);
  perform set_config('request.jwt.claims', '', true);
end $$;

insert into auth.users (id, aud, role, email) values
  ('c4a50000-0000-0000-0000-00000000000a', 'authenticated', 'authenticated', 'a@t.local'),
  ('c4a50000-0000-0000-0000-00000000000b', 'authenticated', 'authenticated', 'b@t.local');

-- Owner can insert; user_id defaults to the caller.
select pg_temp.login('c4a50000-0000-0000-0000-00000000000a');
select lives_ok(
  $$insert into public.client_crash_reports (error_name, message, stack, platform)
    values ('TypeError',
            'Invalid weight 75.2 for jane@x.com id 11111111-2222-3333-4444-555555555555 token eyJabc.def.ghi',
            'at save (weight.ts:123:45) user jane@x.com',
            'ios')$$,
  'a signed-in user can file a crash report');

-- Server-side scrub (read back as the service/owner role).
select pg_temp.logout();
select is(
  (select message from public.client_crash_reports
   where user_id = 'c4a50000-0000-0000-0000-00000000000a'),
  'Invalid weight [n] for [email] id [id] token [token]',
  'the message is scrubbed server-side even if the client missed it');
select is(
  (select stack from public.client_crash_reports
   where user_id = 'c4a50000-0000-0000-0000-00000000000a'),
  'at save (weight.ts:123:45) user [email]',
  'the stack keeps code locations but redacts identifiers');

-- A stack header repeating the message loses its numbers; frames keep theirs.
select pg_temp.login('c4a50000-0000-0000-0000-00000000000b');
select lives_ok(
  $$insert into public.client_crash_reports (error_name, stack, platform)
    values ('Error', E'Error: weight 81.5\n    at save (w.ts:12:3)', 'android')$$,
  'a second user can file a report');
select pg_temp.logout();
select is(
  (select stack from public.client_crash_reports
   where user_id = 'c4a50000-0000-0000-0000-00000000000b'),
  E'Error: weight [n]\n    at save (w.ts:12:3)',
  'stack header numbers are redacted while frame locations are kept');

-- Clients cannot file for others, read, change, or delete reports.
select pg_temp.login('c4a50000-0000-0000-0000-00000000000a');
select throws_ok(
  $$insert into public.client_crash_reports (user_id, error_name, platform)
    values ('c4a50000-0000-0000-0000-00000000000b', 'Error', 'ios')$$,
  '42501', null, 'a user cannot file a report as someone else');
select throws_ok(
  $$select count(*) from public.client_crash_reports$$,
  '42501', null, 'clients can never read crash reports');
select throws_ok(
  $$update public.client_crash_reports set message = 'x'$$,
  '42501', null, 'clients cannot change crash reports');
select throws_ok(
  $$delete from public.client_crash_reports$$,
  '42501', null, 'clients cannot delete crash reports');

-- Strict schema.
select throws_ok(
  $$insert into public.client_crash_reports (error_name, platform)
    values ('Error', 'desktop')$$,
  '23514', null, 'the platform must be on the allowlist');
select throws_ok(
  $$insert into public.client_crash_reports (error_name, platform)
    values (repeat('x', 101), 'ios')$$,
  '23514', null, 'over-long fields are rejected');

-- Anonymous callers cannot file reports.
select pg_temp.anon();
select throws_ok(
  $$insert into public.client_crash_reports (user_id, error_name, platform)
    values ('c4a50000-0000-0000-0000-00000000000a', 'Error', 'ios')$$,
  '42501', null, 'anonymous callers cannot file reports');

-- Analytics: allowlisted, own-user only.
select pg_temp.login('c4a50000-0000-0000-0000-00000000000a');
select throws_ok(
  $$insert into public.analytics_events (event_name, user_id)
    values ('weight_was_75kg', 'c4a50000-0000-0000-0000-00000000000a')$$,
  '23503', null, 'an event name outside the allowlist is rejected');
select throws_ok(
  $$insert into public.analytics_events (event_name, user_id)
    values ('weight_logged', 'c4a50000-0000-0000-0000-00000000000b')$$,
  '42501', null, 'a user cannot record events as someone else');
select lives_ok(
  $$insert into public.analytics_events (event_name, user_id)
    values ('weight_logged', 'c4a50000-0000-0000-0000-00000000000a')$$,
  'an allowlisted event for the caller is accepted');

select pg_temp.logout();
select * from finish();
rollback;
