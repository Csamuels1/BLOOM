// Voice-sensitive strings for the authenticated home. Covered by
// tests/copy.test.ts. Scaffold only — no health calculations or personal data
// in this phase.
export const homeCopy = {
  title: 'Welcome back',
  body: 'You are signed in. This is your private space; real features arrive in the next phases.',
  startOnboarding: 'Set up your space',
  exploreFoundation: 'Explore the app foundation',
  signOut: 'Sign out',

  // Account lifecycle (#20)
  exportData: 'Export my data',
  exportPreparing: 'Preparing your data…',
  exportReady: 'Your data is ready. It stays private to you.',
  exportError: 'We could not prepare your data. Please try again.',
  deleteAccount: 'Delete my account',
  deleteConfirmTitle: 'Delete your account?',
  deleteConfirmBody:
    'This permanently removes your profile and data. This cannot be undone.',
  deleteConfirm: 'Yes, delete permanently',
  deleteCancel: 'Keep my account',
  deleteError: 'We could not delete your account. Please try again.',
} as const;
