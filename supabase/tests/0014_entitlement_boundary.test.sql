-- Entitlement enforcement boundary (issue #45).
--
-- Proves the client can never grant itself Pro or read another account's
-- entitlement: a user sees only their own subscription row (no cross-account
-- leak at the data layer), cannot update or insert a subscription (no
-- self-upgrade), and is_pro() reflects the server-held mirror.
--   A = Pro member, B = Free member.
begin;
select plan(7);

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
  ('aaaa0000-0000-0000-0000-00000000000a', 'authenticated', 'authenticated', 'pro@t.local'),
  ('bbbb0000-0000-0000-0000-00000000000b', 'authenticated', 'authenticated', 'free@t.local');
insert into public.subscriptions (user_id, tier, status) values
  ('aaaa0000-0000-0000-0000-00000000000a', 'pro', 'active'),
  ('bbbb0000-0000-0000-0000-00000000000b', 'free', 'active');

-- A sees only their own row.
select pg_temp.login('aaaa0000-0000-0000-0000-00000000000a');
select is(
  (select count(*)::int from public.subscriptions),
  1, 'a member sees exactly one subscription row (their own)');
select is(public.is_pro(), true, 'is_pro() is true for the Pro member');

-- A cannot upgrade or forge entitlement.
select throws_ok(
  $$update public.subscriptions set tier = 'pro', status = 'active'
      where user_id = 'aaaa0000-0000-0000-0000-00000000000a'$$,
  '42501', null, 'a member cannot update their own subscription (no self-upgrade)');
select throws_ok(
  $$insert into public.subscriptions (user_id, tier, status)
    values ('aaaa0000-0000-0000-0000-00000000000a', 'pro', 'active')$$,
  '42501', null, 'a member cannot insert a subscription row');

-- B cannot see A's entitlement, and is Free.
select pg_temp.login('bbbb0000-0000-0000-0000-00000000000b');
select is(
  (select count(*)::int from public.subscriptions
   where user_id = 'aaaa0000-0000-0000-0000-00000000000a'),
  0, 'a member cannot read another account''s entitlement');
select is(
  (select count(*)::int from public.subscriptions),
  1, 'the Free member sees only their own row');
select is(public.is_pro(), false, 'is_pro() is false for the Free member');

select pg_temp.logout();
select * from finish();
rollback;
