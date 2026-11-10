// Voice-sensitive onboarding copy (issues #13+). Covered by tests/copy.test.ts.
// Warm, non-judgmental, offers choices (docs/BRAND_AND_COPY.md). No shame, no
// body-transformation language, no BMI/scale framing.
export const onboardingCopy = {
  // Shared chrome
  back: 'Back',
  stepProgress: (current: number, total: number) =>
    `Step ${current} of ${total}`,

  // Welcome step
  welcomeTagline: 'Your body, your pace.',
  welcomeBody:
    'A little space for care, at your own pace. We will set things up together, and you can pause anytime — your answers are saved on your device.',
  welcomeBegin: "Let's begin",

  // Goal step
  goalHeading: 'What feels right for you right now?',
  goalIntro:
    'There is no wrong choice, and you can change this whenever you like.',
  goalLossTitle: 'Gentle loss',
  goalLossBody: 'Ease toward feeling lighter, at a kind and steady pace.',
  goalMaintainTitle: 'Maintain',
  goalMaintainBody: 'Find a steady rhythm and keep feeling like yourself.',
  goalGainTitle: 'Healthy gain',
  goalGainBody: 'Build strength and nourish your body with care.',
  goalContinue: 'Continue',

  // Interim placeholder for steps still being built (#14, #15)
  placeholderHeading: 'More to come',
  placeholderBody: 'This part of setup is on its way in an upcoming update.',
} as const;
