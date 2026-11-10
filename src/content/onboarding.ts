// Voice-sensitive onboarding copy (issues #13+). Covered by tests/copy.test.ts.
// Warm, non-judgmental, offers choices (docs/BRAND_AND_COPY.md). No shame, no
// body-transformation language, no BMI/scale framing.
export const onboardingCopy = {
  // Shared chrome
  back: 'Back',
  skip: 'Skip',
  continue: 'Continue',
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

  // Pregnancy question (#14)
  pregnancyHeading: 'Are you currently pregnant?',
  pregnancyIntro:
    'We ask so we can care for you safely. BLOOM is made for postpartum and general wellbeing, not pregnancy.',
  pregnancyYes: 'Yes, I am pregnant',
  pregnancyNo: 'No',

  // Pregnancy care boundary (#14) — a gentle stop, never a weight plan.
  boundaryHeading: 'Let us keep you and your baby safe',
  boundaryBody:
    'Because you are pregnant, BLOOM will not set weight or calorie targets for you. Nutrition during pregnancy is best guided by someone who knows your history.',
  boundaryResources:
    'Please talk with your doctor, midwife, or antenatal clinic about eating well during pregnancy. We will be here for your postpartum journey whenever you are ready.',
  boundaryChange: 'That is not right — go back',

  // Postpartum status (#14)
  postpartumHeading: 'Are you in a postpartum period?',
  postpartumIntro:
    'This helps us offer gentle, recovery-aware context. You can skip anything that does not fit.',
  postpartumYes: 'Yes, I am postpartum',
  postpartumNo: 'Not right now',
  postpartumPreferNot: 'Prefer not to say',

  // Postpartum months (#14, conditional)
  monthsHeading: 'About how long ago?',
  monthsIntro: 'A rough number is perfectly fine.',
  monthsDecrease: 'Fewer months',
  monthsIncrease: 'More months',
  monthsUnitOne: 'month',
  monthsUnitMany: 'months',

  // Feeding context (#14, optional)
  feedingHeading: 'How are you feeding your baby?',
  feedingIntro:
    'This is optional and never used to judge you. It helps us keep suggestions gentle.',
  feedingBreastfeeding: 'Breastfeeding',
  feedingMixed: 'Mixed feeding',
  feedingFormula: 'Formula feeding',
  feedingNotFeeding: 'Not feeding a baby',
  feedingPreferNot: 'Prefer not to say',

  // Stats — height (#15)
  statsHeading: 'A couple of basics',
  statsIntro:
    'We use this to personalize gentle suggestions. Nothing here is used to judge you.',
  heightLabel: 'Height in centimetres',
  heightPlaceholder: 'e.g. 165',
  heightImperial: (feet: number, inches: number) =>
    `About ${feet} ft ${inches} in`,
  errHeightRange: 'Please enter a height between 120 and 230 cm.',

  // Region and units (#15)
  regionHeading: 'Where are you based?',
  regionIntro:
    'We use your region for food suggestions — never your exact location. You can change this.',
  countryNigeria: 'Nigeria',
  countryUnitedStates: 'United States',
  unitsLabel: 'Units',
  unitMetric: 'Metric (kg, cm)',
  unitImperial: 'Imperial (lb, in)',

  // Dietary and allergens (#15)
  dietaryHeading: 'Anything we should keep in mind?',
  dietaryIntro: 'All optional. Choose any that fit — or none at all.',
  dietaryLabel: 'Eating preferences',
  dietaryVegetarian: 'Vegetarian',
  dietaryVegan: 'Vegan',
  dietaryPescatarian: 'Pescatarian',
  dietaryHalal: 'Halal',
  dietaryLowDairy: 'Low dairy',
  allergensLabel: 'Allergens to avoid',
  allergenPeanut: 'Peanut',
  allergenTreeNut: 'Tree nuts',
  allergenMilk: 'Milk',
  allergenEgg: 'Egg',
  allergenSoy: 'Soy',
  allergenWheat: 'Wheat',
  allergenFish: 'Fish',
  allergenShellfish: 'Shellfish',
  allergenDisclaimer:
    'Allergen tags help us filter suggestions, but always check ingredient labels yourself and talk with a professional about serious allergies. BLOOM is not medical advice.',

  // Cycle (#15, optional)
  cycleHeading: 'Would you like gentle cycle context?',
  cycleIntro:
    'Optional. Cycle context can help explain normal fluctuations. You can turn it on later instead.',
  cycleYes: 'Yes, include cycle context',
  cycleNo: 'Not now',

  // Preview / finish (#15)
  previewHeading: 'You are all set',
  previewIntro: 'Here is what we noted. You can change any of it later.',
  previewGoalLabel: 'Goal',
  previewRegionLabel: 'Region',
  previewUnitsLabel: 'Units',
  previewNotSet: 'Not set',
  previewFinish: 'Finish setup',
} as const;
