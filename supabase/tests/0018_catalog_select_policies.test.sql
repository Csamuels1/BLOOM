-- Merged catalog SELECT policies (issue #55).
--
-- Proves the single merged policy per table keeps the exact access the two old
-- policies gave: members see only active + approved meals and active + verified
-- resources; moderators see every row.
begin;
select plan(4);

create function pg_temp.login(uid uuid, moderator boolean default false)
returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims',
    json_build_object('sub', uid::text, 'role', 'authenticated',
      'app_metadata', case when moderator then jsonb_build_object('role', 'moderator')
                           else '{}'::jsonb end)::text, true);
  perform set_config('role', 'authenticated', true);
end $$;

create function pg_temp.logout() returns void language plpgsql as $$
begin
  perform set_config('role', 'postgres', true);
  perform set_config('request.jwt.claims', '', true);
end $$;

insert into auth.users (id, aud, role, email) values
  ('d0d00000-0000-0000-0000-00000000000a', 'authenticated', 'authenticated', 'member@t.local'),
  ('d0d00000-0000-0000-0000-00000000000c', 'authenticated', 'authenticated', 'mod@t.local');

-- One visible and one hidden support resource (seeded catalog meals are all
-- inactive drafts under ADR-0010, so meals are checked by count).
insert into public.support_resources
  (id, region, category, name, verified, is_active, reviewed_at)
values
  ('e1e10000-0000-0000-0000-000000000001', 'global', 'crisis', 'Visible', true, true, now()),
  ('e1e10000-0000-0000-0000-000000000002', 'global', 'crisis', 'Hidden', false, false, null);

select pg_temp.login('d0d00000-0000-0000-0000-00000000000a');
select is(
  (select count(*)::int from public.support_resources
   where id in ('e1e10000-0000-0000-0000-000000000001',
                'e1e10000-0000-0000-0000-000000000002')),
  1, 'a member sees only active, verified resources');
select is(
  (select count(*)::int from public.meals
   where not (is_active and review_status = 'approved')),
  0, 'a member never sees inactive or unapproved meals');

select pg_temp.login('d0d00000-0000-0000-0000-00000000000c', true);
select is(
  (select count(*)::int from public.support_resources
   where id in ('e1e10000-0000-0000-0000-000000000001',
                'e1e10000-0000-0000-0000-000000000002')),
  2, 'a moderator sees every resource');
select cmp_ok(
  (select count(*)::int from public.meals),
  '>', 0, 'a moderator sees the draft meal catalog');

select pg_temp.logout();
select * from finish();
rollback;
