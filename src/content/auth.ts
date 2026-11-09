// Voice-sensitive strings for the auth flow. Covered by tests/copy.test.ts.
// Scaffold only: issue #9 delivers the session/routing plumbing; the email
// registration and recovery forms arrive in issue #10.
export const authCopy = {
  name: 'BLOOM',
  tagline: 'Your body, your pace.',
  welcome: 'Welcome. Take your time — there is no rush here.',
  signInHeading: 'Sign in',
  signInBody:
    'Secure sign-in is on its way. The next update adds email sign-up and account recovery so your space stays private to you.',
  privacyNote:
    'We only ever keep what you choose to share, and you can step away whenever you need to.',
} as const;
