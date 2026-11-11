import { mapDraftToPayload } from '@/features/profile';

describe('mapDraftToPayload', () => {
  it('maps a full draft to the snake_case RPC payload', () => {
    expect(
      mapDraftToPayload({
        goal: 'loss',
        heightCm: 170,
        countryCode: 'NG',
        unitSystem: 'metric',
        postpartumStatus: 'postpartum',
        postpartumMonths: 5,
        feedingContext: 'mixed',
        dietaryPreferences: ['vegan'],
        allergens: ['peanut'],
        trackCycle: true,
      }),
    ).toEqual({
      goal: 'loss',
      height_cm: 170,
      country_code: 'NG',
      unit_system: 'metric',
      postpartum_status: 'postpartum',
      postpartum_months: 5,
      feeding_context: 'mixed',
      dietary_preferences: ['vegan'],
      allergens: ['peanut'],
      track_cycle: true,
      age_confirmed: true,
    });
  });

  it('fills safe defaults for an empty draft (identity comes from the server)', () => {
    expect(mapDraftToPayload({})).toEqual({
      goal: null,
      height_cm: null,
      country_code: null,
      unit_system: 'metric',
      postpartum_status: null,
      postpartum_months: null,
      feeding_context: null,
      dietary_preferences: [],
      allergens: [],
      track_cycle: false,
      age_confirmed: true,
    });
  });
});
