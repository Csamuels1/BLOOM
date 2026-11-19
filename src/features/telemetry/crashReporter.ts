import Constants from 'expo-constants';
import { Platform } from 'react-native';

import { getSupabaseClient, type AppSupabaseClient } from '@/lib/supabase';

import {
  LIMITS,
  safeErrorName,
  scrubMessage,
  scrubStack,
  truncate,
} from './scrub';

/**
 * In-house crash reporting (issue #53, ADR-0014).
 *
 * Reports go only to BLOOM's own backend (client_crash_reports), never to a
 * third party. Every report is scrubbed on-device and limited to a FIXED schema:
 * there is deliberately no context object, breadcrumbs, user properties,
 * screenshots, or session replay. Arbitrary properties on an error (cause, custom
 * fields) are never read. Reporting is fire-and-forget, rate-limited per
 * session, de-duplicated, and never throws.
 */

export type CrashPlatform = 'ios' | 'android' | 'web';

/** The complete, fixed crash schema. Nothing else is ever sent. */
export interface CrashPayload {
  error_name: string;
  message: string | null;
  stack: string | null;
  app_version: string | null;
  platform: CrashPlatform;
}

export const CRASH_PAYLOAD_KEYS = [
  'error_name',
  'message',
  'stack',
  'app_version',
  'platform',
] as const;

/** At most this many reports per app session, so a crash loop can't flood. */
export const MAX_REPORTS_PER_SESSION = 5;

interface CrashMeta {
  appVersion: string | null;
  os: string;
}

function defaultMeta(): CrashMeta {
  return {
    appVersion: Constants.expoConfig?.version ?? null,
    os: Platform.OS,
  };
}

function toPlatform(os: string): CrashPlatform {
  return os === 'ios' || os === 'android' ? os : 'web';
}

/** Build the scrubbed, fixed-schema payload for an error. Pure. */
export function buildCrashPayload(
  error: unknown,
  meta: CrashMeta = defaultMeta(),
): CrashPayload {
  const asError = error instanceof Error ? error : null;
  const rawMessage =
    asError?.message ?? (typeof error === 'string' ? error : null);
  const rawStack = asError?.stack ?? null;

  return {
    error_name: safeErrorName(asError?.name),
    message: rawMessage ? scrubMessage(rawMessage) : null,
    stack: rawStack ? scrubStack(rawStack) : null,
    app_version: meta.appVersion
      ? truncate(meta.appVersion, LIMITS.appVersion)
      : null,
    platform: toPlatform(meta.os),
  };
}

let sentThisSession = 0;
const seen = new Set<string>();

/**
 * Report a crash. Resolves true if a report was recorded; false if it was
 * skipped (rate limit, duplicate, signed out) or failed. Never throws.
 */
export async function reportCrash(
  error: unknown,
  client?: AppSupabaseClient,
): Promise<boolean> {
  try {
    if (sentThisSession >= MAX_REPORTS_PER_SESSION) return false;
    const payload = buildCrashPayload(error);
    const key = `${payload.error_name}:${payload.message ?? ''}`;
    if (seen.has(key)) return false;
    seen.add(key);
    sentThisSession += 1;

    const { error: insertError } = await (client ?? getSupabaseClient())
      .from('client_crash_reports')
      .insert(payload);
    return !insertError;
  } catch {
    return false;
  }
}

type GlobalHandler = (error: unknown, isFatal?: boolean) => void;
interface ErrorUtilsLike {
  getGlobalHandler: () => GlobalHandler | undefined;
  setGlobalHandler: (handler: GlobalHandler) => void;
}

let installed = false;

/**
 * Report uncaught errors without changing how the app handles them: the
 * previous global handler always still runs. Idempotent.
 */
export function installGlobalCrashHandler(): void {
  if (installed) return;
  installed = true;

  const errorUtils = (globalThis as { ErrorUtils?: ErrorUtilsLike }).ErrorUtils;
  if (errorUtils?.getGlobalHandler && errorUtils.setGlobalHandler) {
    const previous = errorUtils.getGlobalHandler();
    errorUtils.setGlobalHandler((error, isFatal) => {
      void reportCrash(error);
      previous?.(error, isFatal);
    });
  }

  const target = globalThis as {
    addEventListener?: (
      type: string,
      listener: (event: unknown) => void,
    ) => void;
  };
  if (typeof target.addEventListener === 'function') {
    target.addEventListener('error', (event) => {
      const e = event as { error?: unknown; message?: unknown };
      void reportCrash(e.error ?? e.message);
    });
    target.addEventListener('unhandledrejection', (event) => {
      void reportCrash((event as { reason?: unknown }).reason);
    });
  }
}

/** Test-only: reset per-session state. */
export function resetCrashReporterForTests(): void {
  sentThisSession = 0;
  seen.clear();
  installed = false;
}
