-- Phase 11, issue #48: versioned, server-side concerning-pattern safety engine.
--
-- Evaluates the caller's OWN longitudinal data for approved concerning patterns
-- and returns non-diagnostic signal codes only — never a diagnosis, never a
-- condition, never another user's data. Design constraints (SECURITY_BASELINE):
--   - Server-side: the evaluation runs in the database, not the client.
--   - Own data only: SECURITY INVOKER + RLS (weight_select_own, #19), and the
--     function takes no user id — it uses auth.uid(), so a caller cannot target
--     anyone else.
--   - Complete data only: a check triggers only when there is enough data over
--     enough time; sparse or short-span data never raises a concerning signal
--     (no false alarms from noise).
--   - Versioned: every result carries the threshold version, so a saved
--     evaluation records exactly which thresholds produced it.
--   - No diagnosis: the output is a list of signal codes mapped client-side to
--     gentle, non-diagnostic support copy (#49). The engine names patterns, not
--     conditions.
--
-- The first implemented pattern is rapid sustained weight loss (exceeding the
-- safe pace from #47 over a sustained window). Intake-based checks would plug in
-- the same way, gated by the same completeness rule, when intake logging exists.
-- Threshold values are pending clinical sign-off (#50); the completeness and
-- no-diagnosis guarantees hold regardless of the specific numbers.

create function public.evaluate_safety_signals(p_as_of date default current_date)
returns jsonb
language plpgsql
stable
security invoker
set search_path = ''
as $$
declare
  -- Versioned thresholds. Bump the version whenever any value changes.
  c_version         constant text    := 'signals-2026.11';
  c_window_days     constant int     := 28;
  c_min_entries     constant int     := 3;
  c_min_span_days   constant int     := 14;
  c_rapid_kg_week   constant numeric := 1.0;

  v_uid        uuid := (select auth.uid());
  v_from       date := p_as_of - c_window_days;
  v_count      int;
  v_earliest   numeric;
  v_earliest_at date;
  v_latest     numeric;
  v_latest_at  date;
  v_span       int;
  v_rate       numeric;
  v_sufficient boolean := false;
  v_signals    jsonb := '[]'::jsonb;
begin
  if v_uid is null then
    return jsonb_build_object(
      'version', c_version, 'as_of', p_as_of, 'window_days', c_window_days,
      'sufficient_data', false, 'signals', '[]'::jsonb);
  end if;

  select count(*) into v_count
  from public.weight_measurements
  where user_id = v_uid and measured_at between v_from and p_as_of;

  if v_count >= c_min_entries then
    select weight_kg, measured_at into v_earliest, v_earliest_at
    from public.weight_measurements
    where user_id = v_uid and measured_at between v_from and p_as_of
    order by measured_at asc, created_at asc
    limit 1;

    select weight_kg, measured_at into v_latest, v_latest_at
    from public.weight_measurements
    where user_id = v_uid and measured_at between v_from and p_as_of
    order by measured_at desc, created_at desc
    limit 1;

    v_span := v_latest_at - v_earliest_at;

    -- Complete data only: enough entries AND enough elapsed time to mean
    -- anything. Otherwise no concerning signal is raised.
    if v_span >= c_min_span_days then
      v_sufficient := true;
      -- Positive rate = kilograms lost per week over the span.
      v_rate := (v_earliest - v_latest) / (v_span::numeric / 7.0);
      if v_rate > c_rapid_kg_week then
        v_signals := jsonb_build_array('rapid_sustained_loss');
      end if;
    end if;
  end if;

  return jsonb_build_object(
    'version', c_version,
    'as_of', p_as_of,
    'window_days', c_window_days,
    'sufficient_data', v_sufficient,
    'signals', v_signals
  );
end;
$$;

comment on function public.evaluate_safety_signals(date) is
  'Non-diagnostic concerning-pattern signals from the caller''s own data. Server-side, own-data-only (SECURITY INVOKER + RLS), complete-data-gated, versioned. Returns signal codes, never a diagnosis.';

-- SECURITY INVOKER runs as the caller, so RLS on weight_measurements already
-- scopes it to their own rows. Public execution is fine; there is no privileged
-- read here.
revoke all on function public.evaluate_safety_signals(date) from public;
grant execute on function public.evaluate_safety_signals(date) to authenticated;
