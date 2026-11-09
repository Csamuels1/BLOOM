// Voice-sensitive strings for the auth flows (issue #10). Covered by
// tests/copy.test.ts. Warm, plain, non-judgmental (docs/BRAND_AND_COPY.md).
//
// Error copy is deliberately neutral: it never states whether an email already
// has an account (docs/SECURITY_BASELINE.md — do not reveal account existence).
export const authCopy = {
  name: 'BLOOM',
  tagline: 'Your body, your pace.',

  // Sign in
  signInHeading: 'Sign in',
  signInIntro: 'Welcome back. Take your time.',
  emailLabel: 'Email',
  emailPlaceholder: 'you@example.com',
  passwordLabel: 'Password',
  passwordPlaceholder: 'Your password',
  signInAction: 'Sign in',
  toRegister: 'Create an account',
  toForgotPassword: 'Forgot your password?',

  // Register
  registerHeading: 'Create your account',
  registerIntro: 'A private space that moves at your pace.',
  confirmPasswordLabel: 'Confirm password',
  confirmPasswordPlaceholder: 'Re-enter your password',
  ageConfirmLabel: 'I confirm I am 18 or older.',
  ageConfirmHint:
    'BLOOM is made for adults. This is required to create an account.',
  registerAction: 'Create account',
  toSignIn: 'Already have an account? Sign in',

  // Verify email
  verifyHeading: 'Check your email',
  verifyBody:
    'If everything looks right, a verification link is on its way. Open it to confirm your email, then come back and sign in.',
  verifyResend: 'Resend the verification email',
  verifyResent: 'If a link is needed, another one is on its way.',
  verifyToSignIn: 'Back to sign in',
  verifyUnverifiedNotice:
    'This account still needs email verification. Check your inbox for the link.',

  // Forgot / reset password
  forgotHeading: 'Reset your password',
  forgotBody:
    'Enter your email and we will send reset instructions if an account is set up for it.',
  forgotAction: 'Send reset instructions',
  forgotSent:
    'If an account exists for that email, reset instructions are on the way. Check your inbox.',
  forgotToSignIn: 'Back to sign in',

  // Update password (after following a recovery link)
  updateHeading: 'Choose a new password',
  updateBody: 'Enter a new password for your account.',
  newPasswordLabel: 'New password',
  updateAction: 'Save new password',
  updateDone: 'Your password is updated. You can sign in now.',

  // Validation (client-side, shown inline)
  errEmailRequired: 'Enter your email.',
  errEmailInvalid: 'Enter a valid email address.',
  errPasswordRequired: 'Enter your password.',
  errPasswordShort: 'Use at least 8 characters.',
  errPasswordsMismatch: 'These passwords do not match.',
  errAgeRequired: 'Please confirm you are 18 or older to continue.',

  // Service errors (neutral — never reveal whether an account exists)
  errSignInGeneric: 'The email or password you entered is incorrect.',
  errRateLimited: 'Please wait a moment, then try again.',
  errNetwork:
    'We could not reach the server. Check your connection and try again.',
  errGeneric: 'Something went wrong. Please try again.',
} as const;
