import { computePlan, type Goal } from '@/features/plan';
import {
  applyCalorieFloor,
  evaluateLossPace,
  MAX_SAFE_WEEKLY_LOSS_KG,
  SAFE_CALORIE_FLOOR,
} from '@/features/safety';

const GOALS: Goal[] = ['loss', 'maintenance', 'gain'];
const FEEDING = [
  undefined,
  'breastfeeding',
  'mixed',
  'formula',
  'not_feeding',
  'prefer_not_to_say',
] as const;

describe('applyCalorieFloor', () => {
  it('raises a below-floor minimum to the floor and reports the raise', () => {
    const r = applyCalorieFloor({ min: 900, max: 1100 });
    expect(r.min).toBe(SAFE_CALORIE_FLOOR);
    expect(r.raisedBy).toBe(SAFE_CALORIE_FLOOR - 900);
    // The max is kept at or above the min so the range stays valid.
    expect(r.max).toBeGreaterThanOrEqual(r.min);
  });

  it('leaves an already-safe range untouched (no incorrect constraint)', () => {
    const r = applyCalorieFloor({ min: 1800, max: 2200 });
    expect(r).toEqual({ min: 1800, max: 2200, raisedBy: 0 });
  });

  it('never lowers a value, for any input (fuzz)', () => {
    for (let i = 0; i < 1000; i += 1) {
      const min = Math.round(Math.random() * 3000);
      const max = min + Math.round(Math.random() * 1000);
      const r = applyCalorieFloor({ min, max });
      expect(r.min).toBeGreaterThanOrEqual(SAFE_CALORIE_FLOOR);
      expect(r.min).toBeGreaterThanOrEqual(min); // only ever raises
      expect(r.max).toBeGreaterThanOrEqual(r.min);
    }
  });
});

describe('evaluateLossPace', () => {
  it('accepts a pace at or below the ceiling, including the boundary', () => {
    expect(evaluateLossPace(MAX_SAFE_WEEKLY_LOSS_KG).ok).toBe(true);
    expect(evaluateLossPace(0.5).ok).toBe(true);
  });

  it('redirects anything over the ceiling to the safe maximum', () => {
    const r = evaluateLossPace(1.5);
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.safeKgPerWeek).toBe(MAX_SAFE_WEEKLY_LOSS_KG);
      expect(r.requestedKgPerWeek).toBe(1.5);
      expect(r.title.length).toBeGreaterThan(0);
      expect(r.body.length).toBeGreaterThan(0);
    }
  });

  it('treats a non-finite or negative request as no pace, never a redirect', () => {
    for (const bad of [NaN, Infinity, -Infinity, -2]) {
      const r = evaluateLossPace(bad);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.kgPerWeek).toBeGreaterThanOrEqual(0);
    }
  });

  it('redirects exactly when over the ceiling (boundary fuzz)', () => {
    for (let i = 0; i < 1000; i += 1) {
      const kg = Math.random() * 3;
      const r = evaluateLossPace(kg);
      expect(r.ok).toBe(kg <= MAX_SAFE_WEEKLY_LOSS_KG);
    }
  });
});

describe('computePlan — the calorie floor cannot be bypassed', () => {
  it('never returns a range below the floor, for any goal and feeding (fuzz)', () => {
    for (const goal of GOALS) {
      for (const feedingContext of FEEDING) {
        const result = computePlan({ goal, isPregnant: false, feedingContext });
        if (result.kind !== 'range') continue;
        expect(result.range.min).toBeGreaterThanOrEqual(SAFE_CALORIE_FLOOR);
        // The range stays exactly the sum of its adjustments, floor included.
        const sumMin = result.adjustments.reduce((s, a) => s + a.appliedMin, 0);
        const sumMax = result.adjustments.reduce((s, a) => s + a.appliedMax, 0);
        expect(result.range.min).toBe(sumMin);
        expect(result.range.max).toBe(sumMax);
      }
    }
  });

  it('does not add a floor adjustment to goals already above it', () => {
    for (const goal of GOALS) {
      const result = computePlan({ goal, isPregnant: false });
      if (result.kind !== 'range') continue;
      expect(result.adjustments.map((a) => a.id)).not.toContain('safety_floor');
    }
  });

  it('stamps a guardrail version on every result for audit', () => {
    const ranged = computePlan({ goal: 'loss', isPregnant: false });
    const pregnant = computePlan({ goal: 'loss', isPregnant: true });
    expect(ranged.guardrailVersion.length).toBeGreaterThan(0);
    expect(pregnant.guardrailVersion.length).toBeGreaterThan(0);
  });
});
