import {
  MAX_HEIGHT_CM,
  MAX_POSTPARTUM_MONTHS,
  MIN_HEIGHT_CM,
  onboardingDraftSchema,
} from '@/features/onboarding/schema';

describe('onboarding draft schema', () => {
  it('accepts an empty draft (fields fill in over the flow)', () => {
    expect(onboardingDraftSchema.parse({})).toEqual({});
  });

  it('accepts a valid partial draft', () => {
    const draft = {
      goal: 'maintenance' as const,
      isPregnant: false,
      postpartumStatus: 'postpartum' as const,
      postpartumMonths: 6,
      unitSystem: 'metric' as const,
      heightCm: 165,
      countryCode: 'NG',
      allergens: ['peanut'],
      trackCycle: true,
    };
    expect(onboardingDraftSchema.parse(draft)).toEqual(draft);
  });

  it('rejects an unknown goal', () => {
    expect(() => onboardingDraftSchema.parse({ goal: 'bulk' })).toThrow();
  });

  it('rejects out-of-range height and postpartum months', () => {
    expect(() =>
      onboardingDraftSchema.parse({ heightCm: MIN_HEIGHT_CM - 1 }),
    ).toThrow();
    expect(() =>
      onboardingDraftSchema.parse({ heightCm: MAX_HEIGHT_CM + 1 }),
    ).toThrow();
    expect(() =>
      onboardingDraftSchema.parse({
        postpartumMonths: MAX_POSTPARTUM_MONTHS + 1,
      }),
    ).toThrow();
  });

  it('requires a two-letter country code (region, not precise location)', () => {
    expect(() =>
      onboardingDraftSchema.parse({ countryCode: 'Nigeria' }),
    ).toThrow();
    expect(onboardingDraftSchema.parse({ countryCode: 'US' }).countryCode).toBe(
      'US',
    );
  });
});
