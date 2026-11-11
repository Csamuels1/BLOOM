import type { OnboardingDraft } from '@/features/onboarding';

/**
 * Map the local onboarding draft to the `persist_onboarding` RPC payload
 * (issue #20). Keys are snake_case to match the database columns; the server
 * forces the row id to `auth.uid()`, so no identity is sent here. Height stays
 * canonical (cm). Age confirmation is attested at registration (#10).
 */
export function mapDraftToPayload(
  draft: OnboardingDraft,
): Record<string, unknown> {
  return {
    goal: draft.goal ?? null,
    height_cm: draft.heightCm ?? null,
    country_code: draft.countryCode ?? null,
    unit_system: draft.unitSystem ?? 'metric',
    postpartum_status: draft.postpartumStatus ?? null,
    postpartum_months: draft.postpartumMonths ?? null,
    feeding_context: draft.feedingContext ?? null,
    dietary_preferences: draft.dietaryPreferences ?? [],
    allergens: draft.allergens ?? [],
    track_cycle: draft.trackCycle ?? false,
    age_confirmed: true,
  };
}
