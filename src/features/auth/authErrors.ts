import { authCopy as copy } from '@/content/auth';

/**
 * Neutral classification of auth failures (issue #10).
 *
 * The mapping deliberately collapses "no such account" and "wrong password"
 * into a single `invalid` reason so error copy never reveals whether an email is
 * registered (docs/SECURITY_BASELINE.md). `unverified` is safe to surface: the
 * server only reports it once the password is correct, so it is shown to the
 * account owner, not to someone probing for addresses.
 */
export type AuthErrorReason =
  'invalid' | 'unverified' | 'rate_limited' | 'network' | 'unknown';

interface AuthErrorLike {
  code?: string;
  name?: string;
  status?: number;
  message?: string;
}

function asAuthError(error: unknown): AuthErrorLike {
  return typeof error === 'object' && error !== null
    ? (error as AuthErrorLike)
    : {};
}

export function classifyAuthError(error: unknown): AuthErrorReason {
  const { code, name, status, message } = asAuthError(error);

  if (code === 'email_not_confirmed') return 'unverified';

  if (
    code === 'invalid_credentials' ||
    code === 'user_not_found' ||
    // Supabase returns a generic 400 for bad sign-in credentials.
    (status === 400 && (code === undefined || code === 'invalid_grant'))
  ) {
    return 'invalid';
  }

  if (typeof code === 'string' && code.includes('rate_limit')) {
    return 'rate_limited';
  }

  // Retryable fetch failures surface as a dedicated error name or no status.
  if (
    name === 'AuthRetryableFetchError' ||
    status === 0 ||
    (status === undefined && /network|fetch|timeout/i.test(message ?? ''))
  ) {
    return 'network';
  }

  return 'unknown';
}

/** Neutral, display-ready copy for a classified reason. */
export function messageForReason(reason: AuthErrorReason): string {
  switch (reason) {
    case 'invalid':
      return copy.errSignInGeneric;
    case 'unverified':
      return copy.verifyUnverifiedNotice;
    case 'rate_limited':
      return copy.errRateLimited;
    case 'network':
      return copy.errNetwork;
    case 'unknown':
    default:
      return copy.errGeneric;
  }
}
