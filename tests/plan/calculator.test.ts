import {
  computePlan,
  CONTENT_VERSION,
  FORMULA_VERSION,
  type Goal,
  type PlanResult,
} from '@/features/plan';

const GOALS: Goal[] = ['loss', 'maintenance', 'gain'];

function asRange(result: PlanResult) {
  if (result.kind !== 'range') throw new Error('expected a range result');
  return result;
}

describe('computePlan — pregnancy hard stop', () => {
  it('never generates targets during pregnancy, for any goal', () => {
    for (const goal of GOALS) {
      const result = computePlan({
        goal,
        isPregnant: true,
        feedingContext: 'breastfeeding',
      });
      expect(result.kind).toBe('no_target');
      if (result.kind === 'no_target') {
        expect(result.reason.length).toBeGreaterThan(0);
      }
    }
  });
});

describe('computePlan — versions persist', () => {
  it('stamps the formula and content versions on every result', () => {
    const ranged = computePlan({ goal: 'maintenance', isPregnant: false });
    const pregnant = computePlan({ goal: 'loss', isPregnant: true });
    for (const r of [ranged, pregnant]) {
      expect(r.formulaVersion).toBe(FORMULA_VERSION);
      expect(r.contentVersion).toBe(CONTENT_VERSION);
    }
  });
});

describe('computePlan — ranges, never a single figure', () => {
  it('returns an ordered range with a narrative for each goal', () => {
    for (const goal of GOALS) {
      const result = asRange(computePlan({ goal, isPregnant: false }));
      expect(result.range.min).toBeLessThan(result.range.max);
      expect(result.narrative.length).toBeGreaterThan(0);
    }
  });

  it('matches the documented draft base ranges by goal', () => {
    expect(
      asRange(computePlan({ goal: 'loss', isPregnant: false })).range,
    ).toEqual({
      min: 1600,
      max: 2000,
    });
    expect(
      asRange(computePlan({ goal: 'maintenance', isPregnant: false })).range,
    ).toEqual({ min: 1800, max: 2200 });
    expect(
      asRange(computePlan({ goal: 'gain', isPregnant: false })).range,
    ).toEqual({
      min: 2000,
      max: 2400,
    });
  });
});

describe('computePlan — adjustments are reviewable', () => {
  it('makes the range exactly the sum of its adjustments', () => {
    const result = asRange(
      computePlan({
        goal: 'maintenance',
        isPregnant: false,
        feedingContext: 'breastfeeding',
      }),
    );
    const sumMin = result.adjustments.reduce((s, a) => s + a.appliedMin, 0);
    const sumMax = result.adjustments.reduce((s, a) => s + a.appliedMax, 0);
    expect(result.range.min).toBe(sumMin);
    expect(result.range.max).toBe(sumMax);
    // Breastfeeding adds a gentle allowance above the base.
    expect(result.adjustments.map((a) => a.id)).toEqual(['goal', 'feeding']);
    expect(result.range.min).toBeGreaterThan(1800);
  });

  it('applies no feeding allowance for formula or not-feeding', () => {
    const base = asRange(
      computePlan({ goal: 'maintenance', isPregnant: false }),
    ).range;
    for (const feedingContext of ['formula', 'not_feeding'] as const) {
      const r = asRange(
        computePlan({ goal: 'maintenance', isPregnant: false, feedingContext }),
      );
      expect(r.range).toEqual(base);
      expect(r.adjustments).toHaveLength(1);
    }
  });
});

describe('computePlan — deterministic (replay)', () => {
  it('returns identical output for identical input', () => {
    const inputs = {
      goal: 'gain' as const,
      isPregnant: false,
      feedingContext: 'mixed' as const,
    };
    expect(computePlan(inputs)).toEqual(computePlan(inputs));
  });
});

describe('computePlan — prohibited output', () => {
  it('keeps narratives free of prescriptive or diagnostic language and of embedded numbers', () => {
    const prohibited = [
      'you must',
      'diagnos',
      'guarantee',
      'target weight',
      'burn',
      'should eat',
    ];
    for (const goal of GOALS) {
      const { narrative } = asRange(computePlan({ goal, isPregnant: false }));
      const lower = narrative.toLowerCase();
      for (const phrase of prohibited) {
        expect(lower).not.toContain(phrase);
      }
      // The narrative never embeds a number — the figure lives only in the range.
      expect(narrative).not.toMatch(/\d/);
    }
  });
});
