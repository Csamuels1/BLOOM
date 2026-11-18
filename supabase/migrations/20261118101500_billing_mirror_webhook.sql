-- Phase 10, issue #44: RevenueCat subscription mirror with idempotent, ordered,
-- audited webhook application.
--
-- The server is the ONLY writer of entitlement state. Clients may read their own
-- subscription (select-own, #19) but have no write grant and never set tier or
-- status. The RevenueCat webhook Edge Function (service role) applies events
-- through public.apply_billing_event(), which is:
--   - idempotent: the RevenueCat event id is the primary key of billing_events,
--     so a replayed event is a no-op;
--   - ordered: an event older than the last one applied to a user never
--     overwrites newer state (no resurrecting a lapsed Pro from a late renewal);
--   - audited: every accepted event is recorded append-only in billing_events,
--     whether or not it changed the mirror.
-- Secrets (the webhook auth token, the service-role key) live server-side only;
-- nothing here trusts a client, and is_pro() keeps reading the mirror (#119).

-- Ordering watermark: the timestamp of the last event applied to this mirror row.
alter table public.subscriptions
  add column last_event_at timestamptz;

-- Append-only audit of every webhook event we accept (duplicates and stale ones
-- included, for traceability). Written only by apply_billing_event().
create table public.billing_events (
  event_id text primary key,
  app_user_id uuid references auth.users (id) on delete set null,
  type text not null,
  store text,
  event_timestamp timestamptz not null,
  period_end timestamptz,
  applied boolean not null default false,
  received_at timestamptz not null default now(),
  payload jsonb
);

comment on table public.billing_events is
  'Append-only audit of RevenueCat webhook events. Written only by apply_billing_event() (service role); event_id is the idempotency key. No client grants.';

create index billing_events_user_idx
  on public.billing_events (app_user_id, event_timestamp desc);

-- Server-only. Supabase default privileges auto-grant table access to anon and
-- authenticated, so we explicitly revoke them: the audit is reachable only by
-- the SECURITY DEFINER function (owner) and the service role. RLS is enabled and
-- carries an unreachable deny-all policy so the "every public table has RLS and a
-- policy" advisor invariant (0005) holds without opening any client access.
revoke all on public.billing_events from anon, authenticated;
alter table public.billing_events enable row level security;

create policy "billing_events_no_client_access" on public.billing_events
  for all to authenticated, anon using (false) with check (false);

-- Apply one RevenueCat event to the mirror, idempotently and in order, recording
-- it in the audit. Returns 'duplicate' (already seen), 'applied' (mirror
-- changed), or 'ignored' (recorded but stale/unknown, no state change).
create function public.apply_billing_event(
  p_event_id text,
  p_app_user_id uuid,
  p_type text,
  p_event_timestamp timestamptz,
  p_period_end timestamptz default null,
  p_store text default null,
  p_payload jsonb default null
) returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_tier text;
  v_status text;
  v_applied boolean := false;
  v_existing_last timestamptz;
begin
  -- Idempotency: first writer of this event id wins; a replay is a no-op.
  insert into public.billing_events
    (event_id, app_user_id, type, store, event_timestamp, period_end, payload)
  values
    (p_event_id, p_app_user_id, p_type, p_store, p_event_timestamp, p_period_end, p_payload)
  on conflict (event_id) do nothing;
  if not found then
    return 'duplicate';
  end if;

  -- Resolve the target entitlement state from the event type. Unknown/transfer
  -- events are recorded but never change state.
  case p_type
    when 'INITIAL_PURCHASE', 'RENEWAL', 'PRODUCT_CHANGE', 'UNCANCELLATION',
         'NON_RENEWING_PURCHASE', 'SUBSCRIPTION_EXTENDED' then
      v_tier := 'pro'; v_status := 'active';
    when 'CANCELLATION' then
      -- Auto-renew off; access continues until the EXPIRATION event.
      v_tier := 'pro'; v_status := 'active';
    when 'BILLING_ISSUE' then
      v_tier := 'pro'; v_status := 'in_grace';
    when 'SUBSCRIPTION_PAUSED' then
      v_tier := 'free'; v_status := 'paused';
    when 'EXPIRATION', 'REFUND' then
      v_tier := 'free'; v_status := 'expired';
    else
      v_tier := null; v_status := null;
  end case;

  if v_tier is not null and p_app_user_id is not null then
    -- Ordering: only apply when this event is at least as new as the last one
    -- applied to the user's mirror.
    select last_event_at into v_existing_last
      from public.subscriptions where user_id = p_app_user_id;

    if v_existing_last is null or p_event_timestamp >= v_existing_last then
      insert into public.subscriptions
        (user_id, tier, status, source, current_period_end, last_event_at)
      values
        (p_app_user_id, v_tier, v_status, 'revenuecat', p_period_end, p_event_timestamp)
      on conflict (user_id) do update
        set tier = excluded.tier,
            status = excluded.status,
            source = 'revenuecat',
            current_period_end = excluded.current_period_end,
            last_event_at = excluded.last_event_at;
      v_applied := true;
    end if;
  end if;

  update public.billing_events set applied = v_applied where event_id = p_event_id;
  return case when v_applied then 'applied' else 'ignored' end;
end;
$$;

-- Server-only: the Edge Function calls this with the service role. Clients
-- (authenticated/anon) have no execute grant, so entitlement cannot be forged
-- through the API.
-- Supabase default privileges grant EXECUTE on new public functions to anon and
-- authenticated; revoke both (and public) so only the service role (the Edge
-- Function) can apply events. This is the server/data boundary that stops a
-- client from forging entitlement.
revoke all on function
  public.apply_billing_event(text, uuid, text, timestamptz, timestamptz, text, jsonb)
  from public, anon, authenticated;
grant execute on function
  public.apply_billing_event(text, uuid, text, timestamptz, timestamptz, text, jsonb)
  to service_role;
