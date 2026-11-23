-- Phase 13, issue #55: least-privilege grants (release-candidate security finding).
--
-- Supabase's default privileges in `public` grant anon and authenticated every
-- table privilege (including TRUNCATE, which RLS does not govern) and EXECUTE on
-- every function. RLS kept data safe, since every table has RLS and every policy
-- is `to authenticated`, and no exposed API path reaches TRUNCATE. But this is
-- the gap that let server-only functions become client-callable twice in Phase
-- 10, and a release candidate should not depend on that luck.
--
-- BLOOM requires sign-in for all data, and auth flows go through GoTrue rather
-- than these tables, so `anon` needs nothing in `public`. Authenticated users
-- never need TRUNCATE, TRIGGER or REFERENCES. Explicit per-table grants made by
-- earlier migrations (for example client_crash_reports insert-only,
-- subscriptions select-only) are unaffected beyond these revocations.

-- 1. anon: nothing in public. Postgres also grants EXECUTE on every function to
--    the PUBLIC pseudo-role, which anon inherits, so that is revoked too.
--    authenticated and service_role keep their own explicit EXECUTE grants
--    (Supabase default ACL), so the app's function access is unchanged.
revoke all on all tables in schema public from anon;
revoke all on all sequences in schema public from anon;
revoke all on all functions in schema public from anon;
revoke execute on all functions in schema public from public;

-- 2. authenticated: no RLS-bypassing or schema-level table privileges.
revoke truncate, trigger, references on all tables in schema public from authenticated;

-- 3. Make future objects least-privilege by default (objects created by the
--    migration role, postgres). New tables and sequences are no longer
--    anon-accessible, and new tables carry no TRUNCATE/TRIGGER/REFERENCES for
--    authenticated.
--
--    Functions are the exception. Postgres hardwires EXECUTE-to-PUBLIC as a
--    GLOBAL default, and a schema-level default can only add to global
--    defaults, never remove them. Changing the global default would also affect
--    functions that future extensions install in other schemas, so it is not
--    done here. Instead pgTAP 0019 fails if ANY public function is executable by
--    anon, so a new function migration must end with
--    `revoke execute on function ... from public, anon;` (the established
--    pattern) or the suite fails.
alter default privileges for role postgres in schema public
  revoke all on tables from anon;
alter default privileges for role postgres in schema public
  revoke all on sequences from anon;
alter default privileges for role postgres in schema public
  revoke all on functions from anon;
alter default privileges for role postgres in schema public
  revoke truncate, trigger, references on tables from authenticated;
