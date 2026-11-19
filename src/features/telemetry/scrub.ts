/**
 * Telemetry scrubbing (issue #53).
 *
 * Runs on-device BEFORE anything is sent, so sensitive values never transmit.
 * The server applies its own scrub as a second line of defence
 * (scrub_crash_report trigger); this client pass is at least as strict, and
 * also strips device usernames out of file paths.
 */

/** Field limits mirrored from the client_crash_reports schema. */
export const LIMITS = {
  errorName: 100,
  message: 500,
  stack: 4000,
  appVersion: 40,
} as const;

const EMAIL = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;
const JWT = /eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]*/g;
const BEARER = /\bBearer\s+[A-Za-z0-9._~+/=-]+/gi;
const UUID =
  /[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/g;
const QUERY = /\?[^\s)]*/g;
const POSIX_HOME = /\/(Users|home)\/[^/\s)]+/g;
const WINDOWS_HOME = /([A-Za-z]:\\Users\\)[^\\\s)]+/g;
const NUMBER = /[0-9]+([.,][0-9]+)?/g;

/** Truncate to a maximum length without splitting the result past the limit. */
export function truncate(value: string, max: number): string {
  return value.length > max ? value.slice(0, max) : value;
}

function scrubIdentifiers(value: string): string {
  return value
    .replace(EMAIL, '[email]')
    .replace(JWT, '[token]')
    .replace(BEARER, 'Bearer [token]')
    .replace(UUID, '[id]')
    .replace(QUERY, '?[redacted]')
    .replace(POSIX_HOME, '/$1/[user]')
    .replace(WINDOWS_HOME, '$1[user]');
}

/**
 * Scrub an error message. Messages are where user data can leak (for example a
 * weight or an email in a validation error), so every number is redacted too.
 */
export function scrubMessage(value: string): string {
  return truncate(
    scrubIdentifiers(value).replace(NUMBER, '[n]'),
    LIMITS.message,
  );
}

/** A stack-frame line: V8/Hermes "at fn (file:1:2)" or JSC "fn@file:1:2". */
const FRAME = /^\s*at\s|@.*:\d+:\d+\s*$/;

/**
 * Scrub a stack trace. On FRAME lines, line and column numbers are kept because
 * they locate code, not people. Every other line, including the header that
 * repeats the error message ("Error: weight 81.5 …"), is scrubbed like a message,
 * numbers included. Identifiers, tokens, query strings, and usernames in paths
 * are redacted everywhere.
 */
export function scrubStack(value: string): string {
  const lines = scrubIdentifiers(value)
    .split('\n')
    .map((line) => (FRAME.test(line) ? line : line.replace(NUMBER, '[n]')));
  return truncate(lines.join('\n'), LIMITS.stack);
}

/** Keep an error name to a safe identifier shape (e.g. "TypeError"). */
export function safeErrorName(value: unknown): string {
  if (typeof value === 'string' && /^[A-Za-z_$][A-Za-z0-9_$.]*$/.test(value)) {
    return truncate(value, LIMITS.errorName);
  }
  return 'Error';
}
