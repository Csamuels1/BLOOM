// Voice-sensitive copy for the deterministic recommendation engine (issue #31).
//
// Every user-facing string the engine can surface lives here so it can be
// reviewed and covered by the prohibited-language test. The supervisor wires
// `recommendationsCopy` into tests/copy.test.ts.
//
// Voice rules (AGENTS.md, docs/BRAND_AND_COPY.md): neutral, supportive, and
// explainable. Reasons describe WHY a meal fits the person's own inputs; they
// never praise or shame food, never say "good"/"bad"/"clean", and never frame a
// meal as a reward or a failure. When nothing safe fits, we say so plainly and
// warmly rather than ever offering something the person asked to avoid.
export const recommendationsCopy = {
  // Reasons attached to every pick (explainability). These are the static
  // building blocks; dynamic reasons (with numbers) are composed from the
  // *Prefix/*Suffix fragments below so the copy stays centralized here.
  reasonRegion: 'Chosen for the region you selected',
  reasonGoal: 'Supports the goal you set',
  reasonAllergenSafe: 'Free from the ingredients you asked to avoid',
  reasonWithinCalories: 'Sits within the calorie range you chose',
  reasonDietary: 'Matches the dietary preferences you set',

  // Slot fragment, e.g. "Fits your breakfast". Neutral, never evaluative.
  reasonSlotPrefix: 'Fits your',

  // Surfaced when a slot has no meal that honours every constraint. We leave the
  // slot open on purpose — we never substitute something unsafe or unwanted.
  gapNoSafeMeal:
    'No idea here yet that fits everything you asked for. We would rather leave this open than suggest something that does not suit you.',

  // Returned by a swap when no other option honours every constraint.
  swapNoAlternative:
    'No other idea here fits everything you asked for right now. The current choice already suits you.',
} as const;

/** Human-readable label for a meal slot, used inside composed reasons. */
export const slotLabel = {
  breakfast: 'breakfast',
  lunch: 'lunch',
  dinner: 'dinner',
  snack: 'snack',
} as const;
