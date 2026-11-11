-- pgTAP tests for the product/community/analytics schema (issue #18).
-- Run with `npm run test:db` against a fresh local reset.
begin;
select plan(18);

insert into auth.users (id, aud, role, email) values
  ('11111111-1111-1111-1111-111111111111', 'authenticated', 'authenticated', 'a@test.local'),
  ('22222222-2222-2222-2222-222222222222', 'authenticated', 'authenticated', 'b@test.local');

-- Tables exist.
select has_table('public', 'meals', 'meals table exists');
select has_table('public', 'support_resources', 'support_resources exists');
select has_table('public', 'subscriptions', 'subscriptions table exists');
select has_table('public', 'community_posts', 'community_posts exists');
select has_table('public', 'post_reactions', 'post_reactions exists');
select has_table('public', 'post_reports', 'post_reports exists');
select has_table('public', 'user_blocks', 'user_blocks table exists');
select has_table('public', 'moderation_actions', 'moderation_actions exists');
select has_table('public', 'analytics_events', 'analytics_events exists');
select has_table('public', 'analytics_event_types', 'analytics_event_types exists');

-- RLS enabled (deny-by-default until #19).
select is(
  (select relrowsecurity from pg_class where oid = 'public.meals'::regclass),
  true, 'meals has RLS enabled');
select is(
  (select relrowsecurity from pg_class where oid = 'public.community_posts'::regclass),
  true, 'community_posts has RLS enabled');
select is(
  (select relrowsecurity from pg_class where oid = 'public.analytics_events'::regclass),
  true, 'analytics_events has RLS enabled');

-- Meal value guards.
select throws_ok(
  $$insert into public.meals (name, region, calories_min, calories_max)
    values ('x', 'both', 500, 400)$$,
  '23514', null, 'a meal with max calories below min is rejected');
select throws_ok(
  $$insert into public.meals (name, region, calories_min, calories_max, is_active)
    values ('x', 'both', 400, 500, true)$$,
  '23514', null, 'an active meal must be approved');

-- Analytics: only allowlisted event names (FK), no arbitrary events.
select throws_ok(
  $$insert into public.analytics_events (event_name) values ('not_allowed')$$,
  '23503', null, 'an unknown analytics event is rejected');
select lives_ok(
  $$insert into public.analytics_events (event_name) values ('weight_logged')$$,
  'an allowlisted analytics event inserts');

-- Blocks cannot target self.
select throws_ok(
  $$insert into public.user_blocks (blocker_id, blocked_id)
    values ('11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111')$$,
  '23514', null, 'a self-block is rejected');

select * from finish();
rollback;
