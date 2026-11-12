// Voice-sensitive copy for subscription tiers (issue #23). Covered by the
// prohibited-language test (tests/copy.test.ts).
//
// Voice (docs/BRAND_AND_COPY.md, AGENTS.md): entitlements are stated plainly and
// without pressure. Free is genuinely useful on its own; Pro is an open door,
// never a locked gate or a guilt trip. No urgency, scarcity, or shame.
export const subscriptionCopy = {
  freePlanLabel: 'Free plan',
  freeDailyIdeas: 'Your three daily meal ideas',

  proTitle: 'More with Pro',
  proBody:
    'Pro adds guidance tailored to you and reviewed by qualified professionals, with more meal ideas and deeper context. Free stays genuinely useful on its own — Pro is here when you want more.',
  proCta: 'Learn about Pro',
  proComingSoon:
    'Pro arrives in a later step. You will always see what is free and what is Pro, and nothing is ever charged without your say-so.',
} as const;
