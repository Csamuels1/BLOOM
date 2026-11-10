import type { SupabaseClient } from '@supabase/supabase-js';

import { authCopy } from '@/content/auth';
import {
  classifyAuthError,
  messageForReason,
} from '@/features/auth/authErrors';
import {
  registerWithEmail,
  requestPasswordReset,
  resendVerification,
  signInWithEmail,
  updatePassword,
} from '@/features/auth/authService';

function clientWith(auth: Record<string, jest.Mock>) {
  return { auth } as unknown as SupabaseClient;
}

const ok = { data: {}, error: null };
const withError = (error: unknown) => ({ data: {}, error });

describe('classifyAuthError', () => {
  it('maps wrong password and unknown account to the same neutral reason', () => {
    expect(classifyAuthError({ code: 'invalid_credentials' })).toBe('invalid');
    expect(classifyAuthError({ code: 'user_not_found' })).toBe('invalid');
    expect(classifyAuthError({ status: 400 })).toBe('invalid');
  });

  it('treats an unconfirmed email as its own reason', () => {
    expect(classifyAuthError({ code: 'email_not_confirmed' })).toBe(
      'unverified',
    );
  });

  it('recognizes rate limiting and network failures', () => {
    expect(classifyAuthError({ code: 'over_email_send_rate_limit' })).toBe(
      'rate_limited',
    );
    expect(classifyAuthError({ name: 'AuthRetryableFetchError' })).toBe(
      'network',
    );
  });

  it('falls back to unknown', () => {
    expect(classifyAuthError({ code: 'something_else' })).toBe('unknown');
    expect(classifyAuthError(null)).toBe('unknown');
  });
});

describe('messageForReason', () => {
  it('uses a generic credential message that does not reveal account existence', () => {
    expect(messageForReason('invalid')).toBe(authCopy.errSignInGeneric);
    // The same message regardless of whether the email is registered.
    expect(messageForReason('invalid')).not.toMatch(/exists|registered|found/i);
  });
});

describe('signInWithEmail', () => {
  it('returns ok on success', async () => {
    const signInWithPassword = jest.fn().mockResolvedValue(ok);
    const result = await signInWithEmail(clientWith({ signInWithPassword }), {
      email: '  a@b.co ',
      password: 'secret123',
    });
    expect(result).toEqual({ ok: true });
    // Email is trimmed before the call.
    expect(signInWithPassword).toHaveBeenCalledWith({
      email: 'a@b.co',
      password: 'secret123',
    });
  });

  it('classifies bad credentials neutrally', async () => {
    const signInWithPassword = jest
      .fn()
      .mockResolvedValue(withError({ code: 'invalid_credentials' }));
    const result = await signInWithEmail(clientWith({ signInWithPassword }), {
      email: 'a@b.co',
      password: 'nope',
    });
    expect(result).toEqual({ ok: false, reason: 'invalid' });
  });

  it('surfaces an unverified email distinctly', async () => {
    const signInWithPassword = jest
      .fn()
      .mockResolvedValue(withError({ code: 'email_not_confirmed' }));
    const result = await signInWithEmail(clientWith({ signInWithPassword }), {
      email: 'a@b.co',
      password: 'secret123',
    });
    expect(result).toEqual({ ok: false, reason: 'unverified' });
  });
});

describe('registerWithEmail', () => {
  it('passes the verification redirect and reports success', async () => {
    const signUp = jest.fn().mockResolvedValue(ok);
    const result = await registerWithEmail(
      clientWith({ signUp }),
      { email: 'a@b.co', password: 'secret123' },
      'bloom://sign-in',
    );
    expect(result).toEqual({ ok: true });
    expect(signUp).toHaveBeenCalledWith({
      email: 'a@b.co',
      password: 'secret123',
      options: { emailRedirectTo: 'bloom://sign-in' },
    });
  });
});

describe('requestPasswordReset (no account enumeration)', () => {
  it('returns ok on success', async () => {
    const resetPasswordForEmail = jest.fn().mockResolvedValue(ok);
    const result = await requestPasswordReset(
      clientWith({ resetPasswordForEmail }),
      'a@b.co',
      'bloom://update-password',
    );
    expect(result).toEqual({ ok: true });
  });

  it('still returns ok when the backend errors non-transiently (looks identical for unknown emails)', async () => {
    const resetPasswordForEmail = jest
      .fn()
      .mockResolvedValue(withError({ code: 'user_not_found' }));
    const result = await requestPasswordReset(
      clientWith({ resetPasswordForEmail }),
      'ghost@b.co',
      'bloom://update-password',
    );
    expect(result).toEqual({ ok: true });
  });

  it('surfaces only transient failures so the user can retry', async () => {
    const resetPasswordForEmail = jest
      .fn()
      .mockResolvedValue(withError({ code: 'over_email_send_rate_limit' }));
    const result = await requestPasswordReset(
      clientWith({ resetPasswordForEmail }),
      'a@b.co',
      'bloom://update-password',
    );
    expect(result).toEqual({ ok: false, reason: 'rate_limited' });
  });
});

describe('resendVerification', () => {
  it('stays neutral on a non-transient error', async () => {
    const resend = jest
      .fn()
      .mockResolvedValue(withError({ code: 'something_else' }));
    const result = await resendVerification(
      clientWith({ resend }),
      'a@b.co',
      'bloom://sign-in',
    );
    expect(result).toEqual({ ok: true });
  });
});

describe('updatePassword', () => {
  it('returns ok on success and failure otherwise', async () => {
    const updateUser = jest.fn().mockResolvedValue(ok);
    expect(
      await updatePassword(clientWith({ updateUser }), 'newsecret1'),
    ).toEqual({ ok: true });

    const failing = jest
      .fn()
      .mockResolvedValue(withError({ code: 'weak_password' }));
    expect(
      await updatePassword(clientWith({ updateUser: failing }), 'short'),
    ).toEqual({ ok: false, reason: 'unknown' });
  });
});
