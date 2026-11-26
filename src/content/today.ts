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

  // Time-of-day greeting (#151), chosen from the device clock only — never from
  // location. Hours before dawn fall under "evening" so night feeds are met
  // softly rather than with an early "morning".
  greetingMorning: 'Good morning',
  greetingAfternoon: 'Good afternoon',
  greetingEvening: 'Good evening',

  // Daily gentle note (#151). The notes themselves are in `todayDailyNotes`.
  dailyNoteLabel: 'A gentle note for today',

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

/**
 * One short, gentle note per day (#151), rotated deterministically by calendar
 * date (see src/features/today/greeting.ts). Calm and kind: rest, nourishment,
 * patience, and asking for help. Never body shape, weight change, "bouncing
 * back", streaks, or pressure. Checked by tests/today/today-greeting.test.ts.
 */
export const todayDailyNotes: readonly string[] = [
  'Rest counts as part of your day, not a break from it.',
  'A glass of water and a few slow breaths are a kind way to begin.',
  'Asking for help is a strength. Let someone share the load today.',
  'Small, steady meals can carry you gently through a busy day.',
  'There is no timeline to keep. Go at your own pace.',
  'If you can, sit down for a moment and simply breathe.',
  'You are allowed to set aside anything that can wait.',
  'Nourishing yourself matters too. You deserve care as well.',
  'Some days move slowly. That is okay.',
  'Saying yes to an offer of help is a gift to you both.',
  'A short rest when you can find one is worth more than a long to-do list.',
  'Be as patient with yourself as you would be with a dear friend.',
  'Reaching out to someone you trust can make today feel a little lighter.',
];
