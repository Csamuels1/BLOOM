// Support resources and gentle check-in copy (issue #49). Non-diagnostic and
// always reachable. Covered by tests/copy.test.ts.
//
// Voice (docs/BRAND_AND_COPY.md, SECURITY_BASELINE): we offer help without
// alarm or diagnosis. The fallback is ALWAYS available, so "talk to someone" is
// reachable even with no verified regional resources and offline. We never label
// anyone or imply a condition — we notice gently and point to real people.
export const supportCopy = {
  title: 'Talk to someone',
  intro:
    'It’s always okay to reach out. Here are some ways to find support — there’s no wrong reason to use them.',

  // Always-available fallback (shown even with zero resources / offline).
  fallbackTitle: 'You can always reach out',
  fallbackBody:
    'Talking to someone you trust — a friend, family member, or your own doctor or midwife — is a kind thing to do for yourself. You don’t need a reason.',
  emergencyTitle: 'If you need help right now',
  emergencyBody:
    'If you or someone else may be in immediate danger, please contact your local emergency services straight away.',

  // Resource list.
  regionLabel: 'Region',
  reviewedPrefix: 'Reviewed',
  reverifyNote: 'These resources are checked before each release.',
  categoryCrisis: 'Crisis support',
  categoryMentalHealth: 'Mental health',
  categoryDietitian: 'Dietitian',
  categoryPostpartum: 'Postpartum support',
  categoryGeneral: 'General support',
  visitAction: 'Visit',
  callAction: 'Call',

  emptyTitle: 'More resources are on the way',
  emptyBody:
    'We’re still adding reviewed resources for your region. The ways to reach out above are always here in the meantime.',

  loadErrorTitle: 'We could not load resources',
  loadErrorBody:
    'The ways to reach out above still work. You can try loading the rest again.',
  retry: 'Try again',

  // Gentle check-in (surfaces a #48 signal non-diagnostically).
  checkInCta: 'Find support',
  checkInDismiss: 'Not now',
} as const;

export default supportCopy;
