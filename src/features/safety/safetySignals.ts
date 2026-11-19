import { safetyCopy } from '@/content/safety';
import type { AppSupabaseClient } from '@/lib/supabase';

/**
 * Client access to the server-side concerning-pattern engine (issue #48).
 *
 * The evaluation happens entirely in the database (evaluate_safety_signals,
 * SECURITY INVOKER + RLS), so this module only calls it, narrows the result, and
 * maps signal CODES to gentle, non-diagnostic support copy. Unknown codes are
 * ignored rather than shown raw, so the client never surfaces anything but
 * reviewed wording. Surfacing (a gentle check-in with resources) is issue #49.
 */

/** Signal codes the client knows how to present. Others are ignored. */
export type SafetySignalCode = 'rapid_sustained_loss';

export interface SafetyEvaluation {
  version: string;
  sufficientData: boolean;
  /** Only recognised, presentable codes. */
  signals: SafetySignalCode[];
}

export interface SignalMessage {
  code: SafetySignalCode;
  title: string;
  body: string;
}

const SIGNAL_MESSAGES: Record<SafetySignalCode, Omit<SignalMessage, 'code'>> = {
  rapid_sustained_loss: {
    title: safetyCopy.signalRapidLossTitle,
    body: safetyCopy.signalRapidLossBody,
  },
};

function isKnownSignal(value: unknown): value is SafetySignalCode {
  return value === 'rapid_sustained_loss';
}

/** Narrow the server's jsonb result into a typed, presentable evaluation. */
export function parseEvaluation(data: unknown): SafetyEvaluation | null {
  if (typeof data !== 'object' || data === null) return null;
  const row = data as Record<string, unknown>;
  const version = typeof row.version === 'string' ? row.version : null;
  if (!version) return null;
  const rawSignals = Array.isArray(row.signals) ? row.signals : [];
  return {
    version,
    sufficientData: row.sufficient_data === true,
    signals: rawSignals.filter(isKnownSignal),
  };
}

/** The gentle, non-diagnostic message for a signal code. */
export function describeSignal(code: SafetySignalCode): SignalMessage {
  return { code, ...SIGNAL_MESSAGES[code] };
}

/**
 * Evaluate the signed-in user's concerning-pattern signals via the server. The
 * server reads only their own data; this never passes a user id. Returns null on
 * error (the caller shows nothing rather than guessing).
 */
export async function fetchSafetySignals(
  client: AppSupabaseClient,
): Promise<SafetyEvaluation | null> {
  // Fail closed: a transport failure (offline, thrown client error) must never
  // surface as an unhandled rejection — the caller simply shows nothing.
  try {
    const { data, error } = await client.rpc('evaluate_safety_signals', {});
    if (error) return null;
    return parseEvaluation(data);
  } catch {
    return null;
  }
}
