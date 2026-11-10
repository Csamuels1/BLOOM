import { z } from 'zod';

import { authCopy as copy } from '@/content/auth';

/** Minimum client-side password length (server enforces its own floor too). */
export const MIN_PASSWORD_LENGTH = 8;

const email = z
  .string({ error: copy.errEmailRequired })
  .trim()
  .min(1, copy.errEmailRequired)
  .pipe(z.email(copy.errEmailInvalid));

const password = z
  .string({ error: copy.errPasswordRequired })
  .min(1, copy.errPasswordRequired)
  .min(MIN_PASSWORD_LENGTH, copy.errPasswordShort);

/** Sign-in: email + a non-empty password (no length rule, to avoid hinting). */
export const signInSchema = z.object({
  email,
  password: z
    .string({ error: copy.errPasswordRequired })
    .min(1, copy.errPasswordRequired),
});
export type SignInValues = z.infer<typeof signInSchema>;

/** Registration: strong password, confirmation match, and 18+ attestation. */
export const registerSchema = z
  .object({
    email,
    password,
    confirmPassword: z
      .string({ error: copy.errPasswordRequired })
      .min(1, copy.errPasswordRequired),
    ageConfirmed: z
      .boolean()
      .refine((value) => value === true, { error: copy.errAgeRequired }),
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ['confirmPassword'],
    error: copy.errPasswordsMismatch,
  });
export type RegisterValues = z.infer<typeof registerSchema>;

/** Forgot password: just an email. */
export const forgotPasswordSchema = z.object({ email });
export type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;

/** Update password: a new strong password + confirmation match. */
export const updatePasswordSchema = z
  .object({
    password,
    confirmPassword: z
      .string({ error: copy.errPasswordRequired })
      .min(1, copy.errPasswordRequired),
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ['confirmPassword'],
    error: copy.errPasswordsMismatch,
  });
export type UpdatePasswordValues = z.infer<typeof updatePasswordSchema>;
