-- Billing mirror + webhook application (issue #44).
--
-- Proves apply_billing_event() is idempotent (replayed event id = no-op),
-- ordered (a stale event never overwrites newer state), and audited, that the
-- mirror drives is_pro(), and that clients can neither call the function nor
-- touch billing_events or forge a subscription.
begin;
select plan(16);

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
  ('99999999-0000-0000-0000-000000000001', 'authenticated', 'authenticated', 'buyer@t.local');

-- Apply the first purchase (as the owner; the Edge Function uses service_role).
select is(
  public.apply_billing_event('evt-purchase', '99999999-0000-0000-0000-000000000001',
    'INITIAL_PURCHASE', '2026-11-18T10:00:00Z', '2026-12-18T10:00:00Z', 'APP_STORE', null),
  'applied', 'an initial purchase is applied to the mirror');

select is(
  (select tier || '/' || status from public.subscriptions
   where user_id = '99999999-0000-0000-0000-000000000001'),
  'pro/active', 'the mirror shows pro/active after purchase');

-- is_pro() reads the caller's own mirror row.
select pg_temp.login('99999999-0000-0000-0000-000000000001');
select is(public.is_pro(), true, 'is_pro() is true for the Pro buyer');
select pg_temp.logout();

-- Idempotency: the same event id is a no-op.
select is(
  public.apply_billing_event('evt-purchase', '99999999-0000-0000-0000-000000000001',
    'INITIAL_PURCHASE', '2026-11-18T10:00:00Z', '2026-12-18T10:00:00Z', 'APP_STORE', null),
  'duplicate', 'a replayed event id is a duplicate no-op');
select is(
  (select count(*)::int from public.billing_events where event_id = 'evt-purchase'),
  1, 'a replayed event writes no second audit row');

-- A billing issue moves to in-grace, which still counts as Pro.
select is(
  public.apply_billing_event('evt-grace', '99999999-0000-0000-0000-000000000001',
    'BILLING_ISSUE', '2026-11-18T10:05:00Z', '2026-12-18T10:00:00Z', 'APP_STORE', null),
  'applied', 'a billing issue is applied');
select is(
  (select status from public.subscriptions where user_id = '99999999-0000-0000-0000-000000000001'),
  'in_grace', 'a billing issue puts the mirror in grace');
select pg_temp.login('99999999-0000-0000-0000-000000000001');
select is(public.is_pro(), true, 'in-grace still counts as Pro');
select pg_temp.logout();

-- Expiration drops to free/expired.
select is(
  public.apply_billing_event('evt-expire', '99999999-0000-0000-0000-000000000001',
    'EXPIRATION', '2026-11-18T10:10:00Z', null, 'APP_STORE', null),
  'applied', 'an expiration is applied');
select pg_temp.login('99999999-0000-0000-0000-000000000001');
select is(public.is_pro(), false, 'is_pro() is false after expiration');
select pg_temp.logout();

-- Ordering: a stale renewal (older than the expiration) must NOT resurrect Pro.
select is(
  public.apply_billing_event('evt-stale-renewal', '99999999-0000-0000-0000-000000000001',
    'RENEWAL', '2026-11-18T09:00:00Z', '2026-12-18T10:00:00Z', 'APP_STORE', null),
  'ignored', 'a stale (out-of-order) renewal is ignored');
select is(
  (select tier || '/' || status from public.subscriptions
   where user_id = '99999999-0000-0000-0000-000000000001'),
  'free/expired', 'the stale renewal did not overwrite newer state');
select is(
  (select applied from public.billing_events where event_id = 'evt-stale-renewal'),
  false, 'the stale event is recorded but marked not applied');

-- Clients cannot call the applier, read the audit, or forge a subscription.
select pg_temp.login('99999999-0000-0000-0000-000000000001');
select throws_ok(
  $$select public.apply_billing_event('evt-forge', '99999999-0000-0000-0000-000000000001',
      'INITIAL_PURCHASE', now(), now(), 'APP_STORE', null)$$,
  '42501', null, 'an authenticated client cannot apply billing events');
select throws_ok(
  $$select count(*) from public.billing_events$$,
  '42501', null, 'an authenticated client cannot read the billing audit');
select throws_ok(
  $$insert into public.subscriptions (user_id, tier, status)
    values ('99999999-0000-0000-0000-000000000001', 'pro', 'active')$$,
  '42501', null, 'an authenticated client cannot forge a subscription row');
select pg_temp.logout();

select * from finish();
rollback;
