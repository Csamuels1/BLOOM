-- Least-privilege grants (issue #55).
--
-- anon holds no privilege on any public table, sequence or function;
-- authenticated holds no TRUNCATE (which bypasses RLS), TRIGGER or REFERENCES;
-- and objects created later inherit the same least-privilege defaults.
begin;
select plan(6);

select is(
  (select count(*)::int
     from pg_class c join pg_namespace n on n.oid = c.relnamespace
     cross join unnest(array['SELECT','INSERT','UPDATE','DELETE','TRUNCATE']) as p(priv)
    where n.nspname = 'public' and c.relkind = 'r'
      and has_table_privilege('anon', c.oid, p.priv)),
  0, 'anon has no privilege on any public table');

select is(
  (select count(*)::int
     from pg_proc pr join pg_namespace n on n.oid = pr.pronamespace
    where n.nspname = 'public'
      and has_function_privilege('anon', pr.oid, 'EXECUTE')),
  0, 'anon cannot execute any public function (a new function that forgets to revoke public/anon fails here)');

select is(
  (select count(*)::int
     from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind = 'r'
      and (has_table_privilege('authenticated', c.oid, 'TRUNCATE')
        or has_table_privilege('authenticated', c.oid, 'TRIGGER'))),
  0, 'authenticated holds no TRUNCATE or TRIGGER on any public table');

-- Not over-revoked: the app's real access paths remain.
select ok(
  has_table_privilege('authenticated', 'public.profiles', 'SELECT')
  and has_function_privilege('authenticated', 'public.is_pro()', 'EXECUTE'),
  'authenticated keeps its intended access');

-- Behavioural: an anonymous caller is refused outright.
set local role anon;
select throws_ok(
  $$select count(*) from public.profiles$$,
  '42501', null, 'an anonymous caller cannot read profiles');
reset role;

-- Future tables inherit least privilege (regression guard for the gotcha).
-- Functions are guarded by the "no anon-executable function" check above.
create table public.zz_privilege_probe (id int);
select ok(
  not has_table_privilege('anon', 'public.zz_privilege_probe', 'SELECT')
  and not has_table_privilege('authenticated', 'public.zz_privilege_probe', 'TRUNCATE'),
  'a newly created table is not anon-readable or truncatable');

select * from finish();
rollback;
