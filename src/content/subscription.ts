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

  // Paywall (issue #43).
  paywallTitle: 'More with Pro',
  paywallIntro:
    'Choose the plan that suits you. Prices come straight from the store in your local currency, and you can cancel anytime. Free stays useful on its own.',
  paywallPerMonth: 'per month',
  paywallPerYear: 'per year',
  paywallChoose: 'Choose this plan',
  paywallPurchasing: 'Completing…',
  paywallRestore: 'Restore a purchase',
  paywallRestoring: 'Restoring…',
  paywallManage: 'Manage your subscription',
  paywallManageHint:
    'You can view, change, or cancel your plan anytime in your App Store or Google Play account.',
  paywallPurchasedTitle: 'You are all set',
  paywallPurchasedBody:
    'Thanks for supporting BLOOM. Your Pro features are unlocking now.',
  paywallCancelled:
    'No change was made and nothing was charged. You can choose a plan whenever you like.',
  paywallLoadError: 'We could not load plans just now. Please try again.',
  paywallEmptyTitle: 'Plans are not available yet',
  paywallEmptyBody:
    'Pro plans are not set up for your store yet. Nothing is charged, and Free stays fully available.',
  paywallUnavailableTitle: 'Open BLOOM on your phone to subscribe',
  paywallUnavailableBody:
    'Purchases happen through the App Store or Google Play, so Pro is managed from the mobile app. Everything else works here.',
  paywallRetry: 'Try again',
} as const;
