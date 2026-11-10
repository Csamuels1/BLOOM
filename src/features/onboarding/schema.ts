import { z } from 'zod';

/**
 * Typed onboarding draft (issue #12).
 *
 * Every field is optional: the draft accumulates as the user moves through the
 * flow and is persisted locally so onboarding can be resumed. Per-step schemas
 * (below) validate the subset a given screen collects. No field here is written
 * to the backend during Phase 3 — persistence to Supabase lands in Phase 4.
 */
export const GOALS = ['loss', 'maintenance', 'gain'] as const;
export type Goal = (typeof GOALS)[number];

export const POSTPARTUM_STATUSES = [
  'postpartum',
  'not_postpartum',
  'prefer_not_to_say',
] as const;
export type PostpartumStatus = (typeof POSTPARTUM_STATUSES)[number];

export const FEEDING_CONTEXTS = [
  'breastfeeding',
  'mixed',
  'formula',
  'not_feeding',
  'prefer_not_to_say',
] as const;
export type FeedingContext = (typeof FEEDING_CONTEXTS)[number];

export const UNIT_SYSTEMS = ['metric', 'imperial'] as const;
export type UnitSystem = (typeof UNIT_SYSTEMS)[number];

/** Minimum/maximum guard rails for a plausible adult height in centimetres. */
export const MIN_HEIGHT_CM = 120;
export const MAX_HEIGHT_CM = 230;
/** Postpartum months the MVP contextualizes (0–24). */
export const MAX_POSTPARTUM_MONTHS = 24;

export const onboardingDraftSchema = z.object({
  goal: z.enum(GOALS).optional(),
  // Pregnancy branch (#14): a current pregnancy routes to a care boundary, not
  // a weight-target plan (docs/PRODUCT_BRIEF.md non-goal).
  isPregnant: z.boolean().optional(),
  pregnancyBoundaryAcknowledged: z.boolean().optional(),
  postpartumStatus: z.enum(POSTPARTUM_STATUSES).optional(),
  postpartumMonths: z
    .number()
    .int()
    .min(0)
    .max(MAX_POSTPARTUM_MONTHS)
    .optional(),
  feedingContext: z.enum(FEEDING_CONTEXTS).optional(),
  // Stats and personalization (#15). Precise location is never collected; only a
  // user-confirmable country/region (docs/ADR-0003).
  heightCm: z.number().min(MIN_HEIGHT_CM).max(MAX_HEIGHT_CM).optional(),
  countryCode: z.string().length(2).optional(),
  unitSystem: z.enum(UNIT_SYSTEMS).optional(),
  dietaryPreferences: z.array(z.string()).optional(),
  allergens: z.array(z.string()).optional(),
  trackCycle: z.boolean().optional(),
});

export type OnboardingDraft = z.infer<typeof onboardingDraftSchema>;
