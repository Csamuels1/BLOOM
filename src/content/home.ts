// Voice-sensitive strings for the authenticated home. Covered by
// tests/copy.test.ts. Account lifecycle copy (export, delete, sign out) moved to
// src/content/settings.ts with the Settings hub (#52).
export const homeCopy = {
  title: 'Welcome back',
  body: 'You are signed in. This is your private space; real features arrive in the next phases.',
  exploreFoundation: 'Explore the app foundation',
} as const;
