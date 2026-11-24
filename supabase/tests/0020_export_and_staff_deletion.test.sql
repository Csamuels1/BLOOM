-- Complete export and staff account deletion (issue #57).
--
-- A user's export contains every category of data linked to them, and none of
-- anyone else's; it never reveals staff identities; and a moderator who has
-- acted can delete their account while the audit history is kept, de-identified.
--   A = member with data everywhere, B = another member, M = moderator.
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

create function pg_temp.logout() returns void language plpgsql as $$
begin
  perform set_config('role', 'postgres', true);
  perform set_config('request.jwt.claims', '', true);
end $$;

insert into auth.users (id, aud, role, email) values
  ('e0e00000-0000-0000-0000-00000000000a', 'authenticated', 'authenticated', 'a@t.local'),
  ('e0e00000-0000-0000-0000-00000000000b', 'authenticated', 'authenticated', 'b@t.local'),
  ('e0e00000-0000-0000-0000-00000000000c', 'authenticated', 'authenticated', 'mod@t.local');

insert into public.weight_measurements (user_id, weight_kg, measured_at) values
  ('e0e00000-0000-0000-0000-00000000000a', 70, '2026-11-01'),
  ('e0e00000-0000-0000-0000-00000000000b', 80, '2026-11-01');
insert into public.cycle_logs (user_id, started_on) values
  ('e0e00000-0000-0000-0000-00000000000a', '2026-11-01');
insert into public.community_posts (id, author_id, body, status, space) values
  ('e0e00000-0000-0000-0000-0000000000a1', 'e0e00000-0000-0000-0000-00000000000a', 'A post', 'approved', 'recovery'),
  ('e0e00000-0000-0000-0000-0000000000b1', 'e0e00000-0000-0000-0000-00000000000b', 'B post', 'approved', 'recovery');
insert into public.post_media (post_id, author_id, storage_path, mime_type, size_bytes, status, reviewed_by) values
  ('e0e00000-0000-0000-0000-0000000000a1', 'e0e00000-0000-0000-0000-00000000000a',
   'e0e00000-0000-0000-0000-00000000000a/x.jpg', 'image/jpeg', 100, 'approved',
   'e0e00000-0000-0000-0000-00000000000c');
insert into public.post_reactions (post_id, user_id) values
  ('e0e00000-0000-0000-0000-0000000000b1', 'e0e00000-0000-0000-0000-00000000000a');
insert into public.post_reports (post_id, reporter_id, reason) values
  ('e0e00000-0000-0000-0000-0000000000b1', 'e0e00000-0000-0000-0000-00000000000a', 'spam');
insert into public.user_blocks (blocker_id, blocked_id) values
  ('e0e00000-0000-0000-0000-00000000000a', 'e0e00000-0000-0000-0000-00000000000b');
insert into public.subscriptions (user_id, tier, status) values
  ('e0e00000-0000-0000-0000-00000000000a', 'pro', 'active');
insert into public.analytics_events (event_name, user_id) values
  ('weight_logged', 'e0e00000-0000-0000-0000-00000000000a'),
  ('weight_logged', 'e0e00000-0000-0000-0000-00000000000b');
insert into public.client_crash_reports (user_id, error_name, platform) values
  ('e0e00000-0000-0000-0000-00000000000a', 'TypeError', 'ios');
insert into public.moderation_actions (moderator_id, target_type, target_id, action) values
  ('e0e00000-0000-0000-0000-00000000000c', 'post', 'e0e00000-0000-0000-0000-0000000000b1', 'approve');

-- Export completeness for A.
select pg_temp.login('e0e00000-0000-0000-0000-00000000000a');
create temp table x as select public.export_current_user() as j;

select is((select jsonb_array_length(j -> 'weight_measurements') from x), 1, 'export: weight (own only)');
select is((select j -> 'weight_measurements' -> 0 ->> 'user_id' from x),
  'e0e00000-0000-0000-0000-00000000000a', 'export never contains another member''s weight');
select is((select jsonb_array_length(j -> 'cycle_logs') from x), 1, 'export: cycle logs');
select is((select jsonb_array_length(j -> 'community_posts') from x), 1, 'export: authored posts only');
select is((select jsonb_array_length(j -> 'post_media') from x), 1, 'export: image metadata');
select ok((select not (j -> 'post_media' -> 0 ? 'reviewed_by') from x), 'export never reveals the reviewing moderator');
select is((select jsonb_array_length(j -> 'post_reactions') from x), 1, 'export: reactions');
select is((select jsonb_array_length(j -> 'post_reports') from x), 1, 'export: reports filed');
select is((select jsonb_array_length(j -> 'user_blocks') from x), 1, 'export: blocks');
select is((select j -> 'subscription' ->> 'tier' from x), 'pro', 'export: subscription status');
select is((select jsonb_array_length(j -> 'analytics_events') from x), 1, 'export: own analytics events only');
select is((select jsonb_array_length(j -> 'crash_reports') from x), 1, 'export: own crash reports');

-- Anonymous callers cannot export.
select pg_temp.logout();
set local role anon;
select throws_ok($$select public.export_current_user()$$, '42501', null,
  'an anonymous caller cannot call the export');
reset role;

-- Staff deletion keeps the audit history, de-identified.
select lives_ok(
  $$delete from auth.users where id = 'e0e00000-0000-0000-0000-00000000000c'$$,
  'a moderator who has acted can delete their account');
select ok(
  (select moderator_id is null from public.moderation_actions
    where target_id = 'e0e00000-0000-0000-0000-0000000000b1')
  and (select reviewed_by is null from public.post_media
    where author_id = 'e0e00000-0000-0000-0000-00000000000a'),
  'the audit and review history remain, de-identified');

select * from finish();
rollback;
