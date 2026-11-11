-- Phase 4, issue #20: onboarding persistence and account lifecycle.
--
-- Three RPCs for the authenticated user. persist_onboarding and
-- export_current_user run as the caller (security invoker) so RLS applies and
-- they can only ever touch the caller's own rows. delete_current_user is
-- security definer because deleting from auth.users and storage requires
-- elevated rights; it is scoped strictly to auth.uid(), callable only by
-- authenticated users, and is a documented security-review item
-- (docs/SECURITY_PATCHES.md). All three force the identity from auth.uid(), so a
-- client-supplied id cannot target another account.

-- Save the onboarding draft to the caller's profile atomically (one upsert).
-- The id is always auth.uid(); canonical units (height in cm) are stored as-is.
create or replace function public.persist_onboarding(p jsonb)
returns public.profiles
language plpgsql
security invoker
set search_path = public
as $$
declare
  result public.profiles;
begin
  if auth.uid() is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;

  insert into public.profiles as pr (
    id, goal, height_cm, country_code, unit_system,
    postpartum_status, postpartum_months, feeding_context,
    dietary_preferences, allergens, track_cycle, age_confirmed,
    onboarding_completed_at
  ) values (
    auth.uid(),
    p ->> 'goal',
    nullif(p ->> 'height_cm', '')::int,
    nullif(p ->> 'country_code', ''),
    coalesce(nullif(p ->> 'unit_system', ''), 'metric'),
    nullif(p ->> 'postpartum_status', ''),
    nullif(p ->> 'postpartum_months', '')::int,
    nullif(p ->> 'feeding_context', ''),
    coalesce(
      (select array_agg(value) from jsonb_array_elements_text(p -> 'dietary_preferences')),
      '{}'),
    coalesce(
      (select array_agg(value) from jsonb_array_elements_text(p -> 'allergens')),
      '{}'),
    coalesce((p ->> 'track_cycle')::boolean, false),
    coalesce((p ->> 'age_confirmed')::boolean, false),
    now()
  )
  on conflict (id) do update set
    goal = excluded.goal,
    height_cm = excluded.height_cm,
    country_code = excluded.country_code,
    unit_system = excluded.unit_system,
    postpartum_status = excluded.postpartum_status,
    postpartum_months = excluded.postpartum_months,
    feeding_context = excluded.feeding_context,
    dietary_preferences = excluded.dietary_preferences,
    allergens = excluded.allergens,
    track_cycle = excluded.track_cycle,
    age_confirmed = excluded.age_confirmed,
    onboarding_completed_at = coalesce(pr.onboarding_completed_at, now())
  returning * into result;

  return result;
end;
$$;

comment on function public.persist_onboarding(jsonb) is
  'Atomically upsert the caller''s profile from an onboarding draft. Identity is auth.uid().';

-- Export the caller's own data (authenticated, RLS-scoped) as a single JSON doc.
create or replace function public.export_current_user()
returns jsonb
language sql
security invoker
stable
set search_path = public
as $$
  select jsonb_build_object(
    'exported_at', now(),
    'profile', (select to_jsonb(p) from public.profiles p where p.id = auth.uid()),
    'weight_measurements', coalesce(
      (select jsonb_agg(to_jsonb(w) order by w.measured_at)
         from public.weight_measurements w where w.user_id = auth.uid()),
      '[]'::jsonb),
    'cycle_logs', coalesce(
      (select jsonb_agg(to_jsonb(c) order by c.started_on)
         from public.cycle_logs c where c.user_id = auth.uid()),
      '[]'::jsonb),
    'community_posts', coalesce(
      (select jsonb_agg(to_jsonb(cp) order by cp.created_at)
         from public.community_posts cp where cp.author_id = auth.uid()),
      '[]'::jsonb)
  );
$$;

comment on function public.export_current_user() is
  'Return the caller''s own data as JSON (RLS-scoped).';

-- Delete the caller's account: deletes the auth user, which cascades to every
-- owned row (FK on delete cascade) and invalidates the user's refresh tokens /
-- sessions. SECURITY DEFINER, scoped strictly to auth.uid().
--
-- Private Storage objects are removed by the client via the Storage API before
-- calling this (direct deletes from storage.objects are blocked by a Storage
-- trigger). Sign-out completes session cleanup client-side.
create or replace function public.delete_current_user()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;

  delete from auth.users where id = uid;
end;
$$;

comment on function public.delete_current_user() is
  'SECURITY REVIEW ITEM: deletes the caller''s auth account (cascades to owned rows). Scoped to auth.uid(); Storage cleanup is client-side via the Storage API.';

-- Lock down execution: only authenticated users, never anon.
revoke all on function public.persist_onboarding(jsonb) from public;
revoke all on function public.export_current_user() from public;
revoke all on function public.delete_current_user() from public;
grant execute on function public.persist_onboarding(jsonb) to authenticated;
grant execute on function public.export_current_user() to authenticated;
grant execute on function public.delete_current_user() to authenticated;
