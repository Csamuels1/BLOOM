import {
  ADJUSTMENTS_VERSION,
  FEEDING_ADJUSTMENTS,
  getFeedingAdjustment,
  type FeedingContext,
} from '@/features/postpartum';

const ALL_CONTEXTS: FeedingContext[] = [
  'breastfeeding',
  'mixed',
  'formula',
  'not_feeding',
  'prefer_not_to_say',
];

describe('feeding adjustments — versioned draft data', () => {
  it('exposes a non-empty ADJUSTMENTS_VERSION stamp', () => {
    expect(typeof ADJUSTMENTS_VERSION).toBe('string');
    expect(ADJUSTMENTS_VERSION.length).toBeGreaterThan(0);
  });

  it('marks every entry as a draft with a reviewable reason', () => {
    for (const context of ALL_CONTEXTS) {
      const entry = FEEDING_ADJUSTMENTS[context];
      expect(entry.isDraft).toBe(true);
      expect(entry.feedingContext).toBe(context);
      expect(entry.reason.length).toBeGreaterThan(0);
    }
  });
});

describe('feeding adjustments — values are safe and consistent', () => {
  it('keeps every allowance non-negative and ordered', () => {
    for (const context of ALL_CONTEXTS) {
      const { allowance } = FEEDING_ADJUSTMENTS[context];
      expect(allowance.min).toBeGreaterThanOrEqual(0);
      expect(allowance.max).toBeGreaterThanOrEqual(allowance.min);
    }
  });

  it('mirrors the plan calculator draft allowance for breastfeeding and mixed', () => {
    expect(FEEDING_ADJUSTMENTS.breastfeeding.allowance).toEqual({
      min: 330,
      max: 500,
    });
    expect(FEEDING_ADJUSTMENTS.mixed.allowance).toEqual({ min: 165, max: 250 });
  });

  it('applies a neutral zero allowance to the non-feeding contexts', () => {
    for (const context of [
      'formula',
      'not_feeding',
      'prefer_not_to_say',
    ] as const) {
      expect(FEEDING_ADJUSTMENTS[context].allowance).toEqual({
        min: 0,
        max: 0,
      });
    }
  });
});

describe('getFeedingAdjustment — safe lookup', () => {
  it('returns the matching versioned entry for a known context', () => {
    for (const context of ALL_CONTEXTS) {
      expect(getFeedingAdjustment(context)).toBe(FEEDING_ADJUSTMENTS[context]);
    }
  });

  it('resolves a missing (null) context to the neutral prefer-not entry', () => {
    const entry = getFeedingAdjustment(null);
    expect(entry).toBe(FEEDING_ADJUSTMENTS.prefer_not_to_say);
    expect(entry.allowance).toEqual({ min: 0, max: 0 });
  });

  it('is deterministic for identical input', () => {
    expect(getFeedingAdjustment('breastfeeding')).toBe(
      getFeedingAdjustment('breastfeeding'),
    );
  });
});
