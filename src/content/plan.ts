// Voice-sensitive copy for the calorie-range plan calculator (issue #32).
// Covered by the prohibited-language test (tests/copy.test.ts).
//
// Voice and SAFETY (AGENTS.md): BLOOM never diagnoses and never prescribes. A
// plan is a gentle RANGE to explore, never a single rule or a target to hit.
// Loss, gain, and maintenance are equal. During pregnancy BLOOM sets no targets
// at all. The formula is a DRAFT pending qualified dietitian review (#33), and
// the copy says so plainly.
export const planCopy = {
  rangeHeading: 'A gentle place to begin',
  rangeLabel: 'A sample daily range',
  rangeUnit: 'kcal',

  // Goal narratives — supportive, never prescriptive, no numbers embedded.
  narrativeLoss:
    'A gentle, gradual range to explore — enough to feel well and nourished while you ease toward what you want, at your own pace.',
  narrativeMaintenance:
    'A steady range to explore — enough to feel nourished and consistent, with room for everyday life.',
  narrativeGain:
    'A supportive range to explore — enough to help you build toward your goal at a comfortable, sustainable pace.',

  // Why the range looks the way it does (auditable, reviewable).
  adjustmentsTitle: 'What shaped this range',
  adjustmentBaseLoss: 'Your goal: a gentle, gradual path',
  adjustmentBaseMaintenance: 'Your goal: steady and consistent',
  adjustmentBaseGain: 'Your goal: a supportive build',
  adjustmentBreastfeeding:
    'Breastfeeding usually needs extra energy, so this adds a gentle allowance — a draft estimate to confirm with your own provider.',

  // Pregnancy care boundary — no targets, ever (mirrors onboarding #14).
  pregnancyNoTargetTitle: 'No targets during pregnancy',
  pregnancyNoTargetBody:
    'BLOOM does not set weight or calorie targets during pregnancy. Nutrition during pregnancy is best guided by someone who knows your history.',

  // Draft disclaimer, shown with every range.
  draftDisclaimer:
    'This is a gentle, general range shown on purpose — an idea to explore, never a rule and never medical advice. Your personalized guidance is prepared and reviewed by qualified professionals before launch.',
} as const;
