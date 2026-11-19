-- Phase 12, issue #53: in-house, sanitized crash reporting (owner decision: no
-- third-party telemetry; see ADR-0014).
--
-- Crash data never leaves BLOOM's own backend. The client scrubs every report
-- BEFORE it is sent and can send only this fixed schema — there is no free-form
-- context, breadcrumb, or property bag, and session replay does not exist.
-- This table is the second line of defence:
--   - insert-only for the signed-in user; clients can never read, update, or
--     delete reports (only the service role can read them);
--   - strict lengths and a platform allowlist;
--   - a BEFORE INSERT trigger that redacts emails, tokens, ids, URL query
--     strings, and numbers in the message even if a client failed to scrub.

create table public.client_crash_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid()
    references auth.users (id) on delete cascade,
  error_name text not null check (char_length(error_name) between 1 and 100),
  message text check (char_length(message) <= 500),
  stack text check (char_length(stack) <= 4000),
  app_version text check (char_length(app_version) <= 40),
  platform text not null check (platform in ('ios', 'android', 'web')),
  occurred_at timestamptz not null default now()
);

comment on table public.client_crash_reports is
  'Sanitized, fixed-schema crash reports. Insert-only for the owner; never client-readable. No PII, no free-form context, no session replay.';

create index client_crash_reports_user_idx
  on public.client_crash_reports (user_id, occurred_at desc);

-- Server-side scrub (defence in depth; the client scrubs first).
create function public.scrub_crash_report()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  -- Message: where user data could leak. Redact identifiers and all numbers.
  new.message := regexp_replace(new.message,
    '[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}', '[email]', 'g');
  new.message := regexp_replace(new.message,
    'eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]*', '[token]', 'g');
  new.message := regexp_replace(new.message,
    '[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}',
    '[id]', 'g');
  new.message := regexp_replace(new.message, '\?[^\s)]*', '?[redacted]', 'g');
  new.message := regexp_replace(new.message, '[0-9]+([.,][0-9]+)?', '[n]', 'g');

  -- Stack: identifiers, tokens, and query strings are redacted everywhere.
  new.stack := regexp_replace(new.stack,
    '[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}', '[email]', 'g');
  new.stack := regexp_replace(new.stack,
    'eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]*', '[token]', 'g');
  new.stack := regexp_replace(new.stack,
    '[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}',
    '[id]', 'g');
  new.stack := regexp_replace(new.stack, '\?[^\s)]*', '?[redacted]', 'g');
  -- Numbers are kept only on stack-FRAME lines (code locations). Any other line,
  -- including the header that repeats the error message, loses its numbers.
  select string_agg(
           case
             when line ~ '^\s*at\s' or line ~ '@.*:[0-9]+:[0-9]+\s*$' then line
             else regexp_replace(line, '[0-9]+([.,][0-9]+)?', '[n]', 'g')
           end,
           E'\n' order by ord)
    into new.stack
    from unnest(string_to_array(new.stack, E'\n')) with ordinality as t(line, ord);
  return new;
end;
$$;

create trigger client_crash_reports_scrub
  before insert on public.client_crash_reports
  for each row execute function public.scrub_crash_report();

-- Trigger function is not callable by clients.
revoke all on function public.scrub_crash_report() from public, anon, authenticated;

-- Access: Supabase default privileges grant everything to anon/authenticated on
-- new tables, so revoke all and grant only insert to signed-in users.
revoke all on public.client_crash_reports from anon, authenticated;
grant insert on public.client_crash_reports to authenticated;

alter table public.client_crash_reports enable row level security;

create policy "crash_reports_insert_own" on public.client_crash_reports
  for insert to authenticated
  with check (user_id = (select auth.uid()));
