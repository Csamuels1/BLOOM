// Voice-sensitive copy for the Today screen (issue #22). Covered by the
// prohibited-language test (tests/copy.test.ts).
//
// Voice rules (docs/BRAND_AND_COPY.md, AGENTS.md): the daily overview leads with
// warmth and context, never a number or a score. Calories are secondary and
// illustrative. Day-to-day weight changes are explicitly NOT the headline — we
// speak about gentle trends over weeks. Meals are ideas to explore, never rules,
// and never framed as "good" or "bad" food.
export const todayCopy = {
  // Header — a calm daily overview, not a performance dashboard.
  title: 'Today',
  intro: 'A gentle overview of your day — no scores, no pressure.',

  // Trend context. In this phase there is no personal weight data yet; this card
  // sets the supportive frame that keeps daily ups and downs out of the spotlight.
  trendTitle: 'The bigger picture',
  trendBody:
    'Your body changes from day to day for all sorts of reasons. BLOOM looks at gentle trends over weeks, so a single day never defines your progress.',
  trendPending:
    'Once you start logging, your weekly trend will appear here — calmly, and in your own time.',

  // Quick log. Real logging arrives in the next phase (Phase 6); we are honest
  // about that rather than showing a fake success.
  quickLogTitle: 'Quick log',
  quickLogWeight: 'Log a weight',
  quickLogMeal: 'Note a meal',
  quickLogComingSoon:
    'Logging opens in the next step of your journey. Nothing to do today.',

  // Meals — ideas, not rules.
  mealsTitle: 'Meal ideas for today',
  mealsIntro:
    'A few ideas to explore. Eat in the way that feels good and sustainable for you.',
  mealsDisclaimer:
    'Example ideas only, not medical advice. Real regional meal guidance is reviewed by qualified professionals before launch.',
  mealCaloriesLabel: 'Approx.',
  mealCaloriesUnit: 'kcal',
  mealLog: 'Note this meal',
  mealExpandHint: 'Shows ingredients and a quick note action.',

  // Presentation states (#23) — gentle, accessible, nothing lost.
  loadingLabel: 'Loading your day…',
  errorTitle: 'We could not load your setup',
  errorBody:
    'Your personalization did not load. You can still explore the ideas below.',
  errorRetry: 'Try again',
  setupTitle: 'Personalize your day',
  setupBody: 'Finish setting up your space to see ideas tailored to you.',
  setupCta: 'Set up your space',

  // Account section (de-emphasized, below the overview).
  accountTitle: 'Your account',
} as const;
