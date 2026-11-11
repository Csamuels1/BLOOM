-- Phase 4 exit gate (issue #21): advisor invariants as regression tests.
--
-- The Supabase security and performance advisors are resolved at this gate.
-- These assertions encode the advisor rules against the catalog so a later
-- migration cannot silently reintroduce a finding -- the suite fails if any
-- public table loses RLS, any public function regains a mutable search_path,
-- any foreign key loses its covering index, or any RLS policy calls an auth
-- helper without the (select ...) wrapper that avoids per-row re-evaluation.

begin;
select plan(5);

-- [SEC] rls_disabled_in_public: every public base table enforces RLS.
select is(
  (select count(*)::int
     from pg_class c
     join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind = 'r' and not c.relrowsecurity),
  0,
  'every public table has row level security enabled'
);

-- [SEC] rls_enabled_no_policy: every public base table has at least one policy.
select is(
  (select count(*)::int
     from pg_class c
     join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind = 'r'
      and not exists (select 1 from pg_policy p where p.polrelid = c.oid)),
  0,
  'every public table has at least one RLS policy'
);

-- [SEC] function_search_path_mutable: every public function pins search_path.
select is(
  (select count(*)::int
     from pg_proc p
     join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and not exists (
        select 1 from unnest(coalesce(p.proconfig, '{}')) cfg
         where cfg like 'search_path=%')),
  0,
  'every public function pins a non-mutable search_path'
);

-- [PERF] unindexed_foreign_keys: every public FK has a covering index.
select is(
  (select count(*)::int
     from pg_constraint c
    where c.contype = 'f'
      and c.connamespace = 'public'::regnamespace
      and not exists (
        select 1 from pg_index i
         where i.indrelid = c.conrelid
           and c.conkey[1] = any(i.indkey))),
  0,
  'every public foreign key is covered by an index'
);

-- [PERF] auth_rls_initplan: no policy calls auth.*() outside a (select ...).
select is(
  (select count(*)::int
     from pg_policy pol
     join pg_class c on c.oid = pol.polrelid
     join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and (pg_get_expr(pol.polqual, pol.polrelid) ~* '(?<!select )auth\.(uid|jwt|role)\('
        or pg_get_expr(pol.polwithcheck, pol.polrelid) ~* '(?<!select )auth\.(uid|jwt|role)\(')),
  0,
  'every RLS policy wraps auth helper calls in (select ...)'
);

select * from finish();
rollback;
