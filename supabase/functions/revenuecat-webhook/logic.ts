// Pure, runtime-agnostic logic for the RevenueCat webhook (issue #44).
//
// This module has no Deno or Node specifics so it is typechecked by the repo's
// tsc and unit-tested with Jest (tests/billing/webhook-logic.test.ts). The Deno
// entrypoint (index.ts) wires it to the request, the env secret, and the
// service-role Supabase client. Keeping the decisions here means the security
// behaviour — auth check, payload validation, event normalisation — is tested in
// CI without a live RevenueCat or a running Edge Function.

/** Parameters passed straight to the apply_billing_event() RPC. */
export interface ApplyEventParams {
  p_event_id: string;
  p_app_user_id: string;
  p_type: string;
  p_event_timestamp: string;
  p_period_end: string | null;
  p_store: string | null;
  p_payload: Record<string, unknown>;
}

export type ParseResult =
  { ok: true; params: ApplyEventParams } | { ok: false; reason: string };

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Constant-time-ish comparison of the request's Authorization header against the
 * configured webhook secret. Returns false when the secret is unset or the
 * header is missing, so a misconfigured function fails closed rather than open.
 */
export function isAuthorized(
  header: string | null | undefined,
  secret: string | null | undefined,
): boolean {
  if (!secret || !header) return false;
  // Length-independent compare to avoid early-exit timing leaks.
  const a = header;
  const b = secret;
  let mismatch = a.length === b.length ? 0 : 1;
  const max = Math.max(a.length, b.length);
  for (let i = 0; i < max; i += 1) {
    mismatch |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  }
  return mismatch === 0;
}

function asString(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null;
}

function msToIso(value: unknown): string | null {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
    return null;
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

/**
 * Validate and normalise a RevenueCat webhook body into RPC parameters. The app
 * user id is the Supabase user id (set as the RevenueCat app user id, #43) and
 * must be a UUID; anything else is rejected rather than guessed.
 */
export function parseWebhook(body: unknown): ParseResult {
  if (typeof body !== 'object' || body === null) {
    return { ok: false, reason: 'not an object' };
  }
  const event = (body as { event?: unknown }).event;
  if (typeof event !== 'object' || event === null) {
    return { ok: false, reason: 'missing event' };
  }
  const e = event as Record<string, unknown>;

  const eventId = asString(e.id);
  if (!eventId) return { ok: false, reason: 'missing event id' };

  const type = asString(e.type);
  if (!type) return { ok: false, reason: 'missing type' };

  const appUserId = asString(e.app_user_id);
  if (!appUserId || !UUID_RE.test(appUserId)) {
    // Anonymous / non-UUID app user ids (e.g. RevenueCat's own $RCAnonymousID)
    // are not our users; reject so nothing is mis-applied.
    return { ok: false, reason: 'app_user_id is not a Supabase user id' };
  }

  const eventTimestamp = msToIso(e.event_timestamp_ms);
  if (!eventTimestamp)
    return { ok: false, reason: 'missing event_timestamp_ms' };

  return {
    ok: true,
    params: {
      p_event_id: eventId,
      p_app_user_id: appUserId,
      p_type: type,
      p_event_timestamp: eventTimestamp,
      p_period_end: msToIso(e.expiration_at_ms),
      p_store: asString(e.store),
      p_payload: {
        id: eventId,
        type,
        store: asString(e.store),
        environment: asString(e.environment),
      },
    },
  };
}
