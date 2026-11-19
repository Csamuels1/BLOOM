// Voice-sensitive copy for Settings, privacy controls, legal placeholders, and
// help (issue #52). Covered by tests/copy.test.ts.
//
// Voice rules (docs/BRAND_AND_COPY.md): calm, plain, no pressure. Errors say
// what happened and offer a retry; nothing here blames the person.
//
// LEGAL: BLOOM does not ship legal text written by engineering. The legal
// screens are clearly marked placeholders until the owner provides the final
// documents before launch.
export const settingsCopy = {
  title: 'Settings',
  intro: 'Your account, privacy, and reminders, all in one calm place.',
  homeLink: 'Settings',
  backHome: 'Back to home',
  backToSettings: 'Back to settings',
  retry: 'Try again',
  loadingLabel: 'Loading your settings…',

  // ---- Account ----
  accountTitle: 'Account',
  emailLabel: 'Signed in as',
  emailUnavailable: 'Your email is not available right now.',
  planLabel: 'Your plan',
  planFree: 'Free',
  planPro: 'Pro',
  planChecking: 'Checking your plan…',
  planError: 'We could not check your plan right now. You can try again.',
  planLink: 'See plans',
  setupLink: 'Set up your space',
  signOut: 'Sign out',
  signingOut: 'Signing out…',
  signOutError: 'We could not sign you out. Please try again.',

  // ---- Notifications ----
  notificationsTitle: 'Notifications',
  notificationsBody: 'Choose if and when BLOOM sends gentle reminders.',
  notificationsLink: 'Reminder settings',

  // ---- Privacy ----
  privacyTitle: 'Privacy',
  privacyBody:
    'Your data is private to you. You can take a copy of it or delete it at any time.',
  exportData: 'Export my data',
  exportReady:
    'Your data is ready. Share a copy to a place you trust; it stays private to you.',
  exportShare: 'Share a copy',
  exportShareError:
    'We could not open sharing on this device. Please try again.',
  exportError: 'We could not prepare your data. Please try again.',
  deleteAccount: 'Delete my account',
  deleteConfirmTitle: 'Delete your account?',
  deleteConfirmBody:
    'This permanently removes your profile and data. This cannot be undone.',
  deleteConfirm: 'Yes, delete permanently',
  deleteCancel: 'Keep my account',
  deleteError: 'We could not delete your account. Nothing was removed yet.',
  deleteDone: 'Your account has been deleted.',

  cycleTitle: 'Cycle tracking',
  cycleLabel: 'Track my cycle',
  cycleBody: 'Optional. You can turn this on or off whenever you like.',
  cycleSaving: 'Saving…',
  cycleSaved: 'Saved.',
  cycleError:
    'We could not save that change, so nothing changed. Please try again.',
  preferencesLoadError:
    'We could not load your privacy preferences. Your settings are unchanged.',
  preferencesEmptyTitle: 'Nothing to set yet',
  preferencesEmptyBody:
    'Once you set up your space, your privacy preferences appear here.',
  preferencesEmptyAction: 'Set up your space',

  blockedLink: 'Blocked members',
  reportsLink: 'Your reports',

  // ---- Legal ----
  legalTitle: 'Legal',
  privacyPolicyLink: 'Privacy policy',
  termsLink: 'Terms of use',
  privacyPolicyTitle: 'Privacy policy',
  termsTitle: 'Terms of use',
  legalPlaceholderLabel: 'Placeholder',
  legalPlaceholderBody:
    'This is a placeholder. The final document will be provided by BLOOM’s owner before launch.',
  legalPlaceholderNote: 'Nothing on this page is a final legal document yet.',

  // ---- Help ----
  helpTitle: 'Help',
  helpBody:
    'If something is not working, or things feel hard right now, you do not have to figure it out alone.',
  supportLink: 'Talk to someone',
} as const;
