// @ts-nocheck
// RevenueCat webhook Edge Function (issue #44). Deno runtime — excluded from the
// repo tsc/eslint (the testable decisions live in ./logic.ts, which IS checked
// and Jest-tested). This entrypoint only wires the request to the secret, the
// validated payload, and the service-role RPC that applies the event.
//
// Security:
//   - Rejects any request whose Authorization header does not match the
//     server-held REVENUECAT_WEBHOOK_SECRET (fails closed if unset).
//   - Uses the service-role key (server-only env) to call apply_billing_event,
//     which is the sole writer of entitlement state and is itself idempotent,
//     ordered, and audited. No client ever reaches this key or this RPC.
//
// Deploy: supabase functions deploy revenuecat-webhook --no-verify-jwt
//   (RevenueCat is not a Supabase user; auth is the shared-secret header, so the
//   platform JWT check is disabled and this function enforces its own auth.)
// Secrets: supabase secrets set REVENUECAT_WEBHOOK_SECRET=... (and the standard
//   SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are injected by the platform).

import { createClient } from 'jsr:@supabase/supabase-js@2';

import { isAuthorized, parseWebhook } from './logic.ts';

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method !== 'POST') {
    return new Response('method not allowed', { status: 405 });
  }

  const secret = Deno.env.get('REVENUECAT_WEBHOOK_SECRET');
  if (!isAuthorized(req.headers.get('Authorization'), secret)) {
    return new Response('unauthorized', { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return new Response('invalid json', { status: 400 });
  }

  const parsed = parseWebhook(body);
  if (!parsed.ok) {
    // 200 so RevenueCat does not retry an event we will never apply (e.g. an
    // anonymous app user id); it is still a no-op for the mirror.
    return new Response(
      JSON.stringify({ status: 'skipped', reason: parsed.reason }),
      {
        status: 200,
        headers: { 'content-type': 'application/json' },
      },
    );
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { persistSession: false } },
  );

  const { data, error } = await supabase.rpc(
    'apply_billing_event',
    parsed.params,
  );
  if (error) {
    // 500 so RevenueCat retries; apply_billing_event is idempotent, so a retry
    // after a partial failure is safe.
    return new Response(JSON.stringify({ status: 'error' }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ status: data }), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });
});
