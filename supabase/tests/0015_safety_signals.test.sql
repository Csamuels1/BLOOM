-- Concerning-pattern safety engine (issue #48).
--
-- Proves evaluate_safety_signals() is server-side, own-data-only, triggers only
-- on complete data over a real span, is versioned, deterministic, and emits
-- non-diagnostic codes only.
--   A = rapid sustained loss (concerning)   B = gentle loss (safe)
--   C = too few entries (incomplete)         D = rapid but over a short span
begin;
select plan(11);

create function pg_temp.login(uid uuid)
returns void language plpgsql as $$
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
  ('a5a50000-0000-0000-0000-00000000000a', 'authenticated', 'authenticated', 'rapid@t.local'),
  ('a5a50000-0000-0000-0000-00000000000b', 'authenticated', 'authenticated', 'gentle@t.local'),
  ('a5a50000-0000-0000-0000-00000000000c', 'authenticated', 'authenticated', 'few@t.local'),
  ('a5a50000-0000-0000-0000-00000000000d', 'authenticated', 'authenticated', 'short@t.local');

-- A: 80 -> 75 kg across 28 days = 1.25 kg/week (over the 1.0 ceiling).
insert into public.weight_measurements (user_id, weight_kg, measured_at) values
  ('a5a50000-0000-0000-0000-00000000000a', 80.0, '2026-10-22'),
  ('a5a50000-0000-0000-0000-00000000000a', 78.0, '2026-11-05'),
  ('a5a50000-0000-0000-0000-00000000000a', 75.0, '2026-11-19');
-- B: 80 -> 79.5 kg across 28 days = ~0.12 kg/week (gentle).
insert into public.weight_measurements (user_id, weight_kg, measured_at) values
  ('a5a50000-0000-0000-0000-00000000000b', 80.0, '2026-10-22'),
  ('a5a50000-0000-0000-0000-00000000000b', 79.8, '2026-11-05'),
  ('a5a50000-0000-0000-0000-00000000000b', 79.5, '2026-11-19');
-- C: a single entry (not enough to evaluate).
insert into public.weight_measurements (user_id, weight_kg, measured_at) values
  ('a5a50000-0000-0000-0000-00000000000c', 75.0, '2026-11-19');
-- D: rapid drop but only across 2 days (too short to mean anything).
insert into public.weight_measurements (user_id, weight_kg, measured_at) values
  ('a5a50000-0000-0000-0000-00000000000d', 80.0, '2026-11-17'),
  ('a5a50000-0000-0000-0000-00000000000d', 78.5, '2026-11-18'),
  ('a5a50000-0000-0000-0000-00000000000d', 77.0, '2026-11-19');

-- A: concerning pattern on complete data.
select pg_temp.login('a5a50000-0000-0000-0000-00000000000a');
select is(
  public.evaluate_safety_signals('2026-11-19') ->> 'sufficient_data', 'true',
  'rapid loss with enough data is evaluated');
select is(
  public.evaluate_safety_signals('2026-11-19') -> 'signals',
  '["rapid_sustained_loss"]'::jsonb,
  'rapid sustained loss raises the non-diagnostic signal');
select is(
  public.evaluate_safety_signals('2026-11-19') ->> 'version', 'signals-2026.11',
  'every result is stamped with the threshold version');
select is(
  public.evaluate_safety_signals('2026-11-19') ? 'diagnosis', false,
  'no diagnosis is ever emitted');
-- Replay: identical input yields identical output.
select is(
  public.evaluate_safety_signals('2026-11-19'),
  public.evaluate_safety_signals('2026-11-19'),
  'evaluation is deterministic (replay-safe)');

-- B: gentle loss, enough data, no concerning signal.
select pg_temp.login('a5a50000-0000-0000-0000-00000000000b');
select is(
  public.evaluate_safety_signals('2026-11-19') ->> 'sufficient_data', 'true',
  'gentle loss with enough data is evaluated');
select is(
  public.evaluate_safety_signals('2026-11-19') -> 'signals', '[]'::jsonb,
  'a safe pace raises no signal');

-- C: too few entries -> never triggers (missing-data guard).
select pg_temp.login('a5a50000-0000-0000-0000-00000000000c');
select is(
  public.evaluate_safety_signals('2026-11-19') ->> 'sufficient_data', 'false',
  'too few entries is treated as incomplete');
select is(
  public.evaluate_safety_signals('2026-11-19') -> 'signals', '[]'::jsonb,
  'incomplete data never raises a concerning signal');

-- D: rapid but over too short a span -> never triggers.
select pg_temp.login('a5a50000-0000-0000-0000-00000000000d');
select is(
  public.evaluate_safety_signals('2026-11-19') ->> 'sufficient_data', 'false',
  'a too-short span is treated as incomplete, not concerning');

-- Logged out / no identity -> nothing to evaluate.
select pg_temp.logout();
select is(
  public.evaluate_safety_signals('2026-11-19') ->> 'sufficient_data', 'false',
  'no signed-in user means no evaluation');

select * from finish();
rollback;
