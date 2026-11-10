import type { SupabaseClient } from '@supabase/supabase-js';

import { classifyAuthError, type AuthErrorReason } from './authErrors';

/**
 * Auth operations for the email flows (issue #10).
 *
 * Each returns a neutral, discriminated result instead of throwing, so screens
 * render copy from the reason without branching on provider internals. Results
 * never reveal whether an email is registered:
 * - sign-up is enumeration-safe by design — Supabase returns success for an
 *   already-registered email (with an empty identities array), so we always
 *   route to the "check your email" screen;
 * - password reset returns success for unknown emails too, so we treat a
 *   non-transient outcome as success regardless.
 */
export type AuthResult = { ok: true } | { ok: false; reason: AuthErrorReason };

const SUCCESS: AuthResult = { ok: true };

function failure(error: unknown): AuthResult {
  return { ok: false, reason: classifyAuthError(error) };
}

export async function signInWithEmail(
  client: SupabaseClient,
  values: { email: string; password: string },
): Promise<AuthResult> {
  const { error } = await client.auth.signInWithPassword({
    email: values.email.trim(),
    password: values.password,
  });
  return error ? failure(error) : SUCCESS;
}

export async function registerWithEmail(
  client: SupabaseClient,
  values: { email: string; password: string },
  emailRedirectTo: string,
): Promise<AuthResult> {
  const { error } = await client.auth.signUp({
    email: values.email.trim(),
    password: values.password,
    options: { emailRedirectTo },
  });
  // A non-error response is enumeration-safe; always show the verify screen.
  return error ? failure(error) : SUCCESS;
}

export async function resendVerification(
  client: SupabaseClient,
  email: string,
  emailRedirectTo: string,
): Promise<AuthResult> {
  const { error } = await client.auth.resend({
    type: 'signup',
    email: email.trim(),
    options: { emailRedirectTo },
  });
  // Only surface transient problems; otherwise stay neutral.
  if (!error) return SUCCESS;
  const reason = classifyAuthError(error);
  return reason === 'rate_limited' || reason === 'network'
    ? { ok: false, reason }
    : SUCCESS;
}

export async function requestPasswordReset(
  client: SupabaseClient,
  email: string,
  redirectTo: string,
): Promise<AuthResult> {
  const { error } = await client.auth.resetPasswordForEmail(email.trim(), {
    redirectTo,
  });
  // Unknown-email errors must look identical to success (no enumeration). Only
  // transient failures are surfaced so the user knows to retry.
  if (!error) return SUCCESS;
  const reason = classifyAuthError(error);
  return reason === 'rate_limited' || reason === 'network'
    ? { ok: false, reason }
    : SUCCESS;
}

export async function updatePassword(
  client: SupabaseClient,
  newPassword: string,
): Promise<AuthResult> {
  const { error } = await client.auth.updateUser({ password: newPassword });
  return error ? failure(error) : SUCCESS;
}
