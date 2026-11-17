import { estimateCycleInsight, type CycleInsight } from '@/features/cycle';

/** Narrow to the estimate variant, failing loudly if it isn't one. */
function asEstimate(insight: CycleInsight) {
  if (insight.kind !== 'estimate') {
    throw new Error(`expected an estimate, got ${insight.kind}`);
  }
  return insight;
}

describe('estimateCycleInsight — insufficient data', () => {
  it('returns insufficient-data with no phase for zero starts', () => {
    const insight = estimateCycleInsight([], '2026-11-01');
    expect(insight.kind).toBe('insufficient-data');
    expect(insight.confidence).toBe('insufficient');
    expect(insight).not.toHaveProperty('estimatedPhase');
  });

  it('returns insufficient-data for a single start (no guess invented)', () => {
    const insight = estimateCycleInsight(['2026-10-01'], '2026-11-01');
    expect(insight.kind).toBe('insufficient-data');
    if (insight.kind === 'insufficient-data') {
      expect(insight.startCount).toBe(1);
    }
  });

  it('treats duplicate dates as a single start (still insufficient)', () => {
    const insight = estimateCycleInsight(
      ['2026-10-01', '2026-10-01'],
      '2026-11-01',
    );
    expect(insight.kind).toBe('insufficient-data');
  });
});

describe('estimateCycleInsight — regular series', () => {
  const starts = ['2026-09-01', '2026-09-29', '2026-10-27']; // 28-day intervals

  it('gives a moderate-confidence estimate with a ~28 day average', () => {
    const insight = asEstimate(estimateCycleInsight(starts, '2026-10-29'));
    expect(insight.confidence).toBe('moderate');
    expect(insight.averageCycleLength).toBe(28);
    expect(insight.startCount).toBe(3);
  });

  it('estimates an early (menstrual) phase just after a start', () => {
    const insight = asEstimate(estimateCycleInsight(starts, '2026-10-29'));
    expect(insight.daysSinceLastStart).toBe(2);
    expect(insight.estimatedPhase).toBe('menstrual');
    expect(insight.estimatedCycleDay).toBe(3);
    expect(insight.overdue).toBe(false);
  });

  it('estimates a later (luteal) phase well into the cycle', () => {
    const insight = asEstimate(estimateCycleInsight(starts, '2026-11-14'));
    expect(insight.daysSinceLastStart).toBe(18);
    expect(insight.estimatedPhase).toBe('luteal');
  });

  it('declines to guess a phase when the last start is long overdue', () => {
    const insight = asEstimate(estimateCycleInsight(starts, '2026-12-20'));
    expect(insight.overdue).toBe(true);
    expect(insight.estimatedPhase).toBe('uncertain');
    expect(insight.estimatedCycleDay).toBeNull();
  });
});

describe('estimateCycleInsight — irregular series', () => {
  it('returns low confidence when intervals vary widely', () => {
    const insight = asEstimate(
      estimateCycleInsight(
        ['2026-07-01', '2026-07-22', '2026-09-05'], // 21 then 45 days
        '2026-09-10',
      ),
    );
    expect(insight.confidence).toBe('low');
  });

  it('returns low confidence from a single interval (regularity unknown)', () => {
    const insight = asEstimate(
      estimateCycleInsight(['2026-10-01', '2026-10-29'], '2026-10-31'),
    );
    expect(insight.confidence).toBe('low');
    expect(insight.averageCycleLength).toBe(28);
  });
});

describe('estimateCycleInsight — safety and determinism', () => {
  const starts = ['2026-09-01', '2026-09-29', '2026-10-27'];

  it('is deterministic: same inputs produce an identical result', () => {
    const a = estimateCycleInsight(starts, '2026-11-05');
    const b = estimateCycleInsight([...starts], '2026-11-05');
    expect(a).toEqual(b);
  });

  it('is order-independent (starts are normalized)', () => {
    const shuffled = ['2026-10-27', '2026-09-01', '2026-09-29'];
    expect(estimateCycleInsight(shuffled, '2026-11-05')).toEqual(
      estimateCycleInsight(starts, '2026-11-05'),
    );
  });

  it('carries explicit confidence, never a definitive claim', () => {
    const insight = estimateCycleInsight(starts, '2026-11-05');
    // The result is a structured estimate: confidence is always present and is
    // one of the uncertainty levels — there is no "certain"/"definite" flag.
    expect(['insufficient', 'low', 'moderate']).toContain(insight.confidence);
    expect(insight).not.toHaveProperty('certain');
    expect(insight).not.toHaveProperty('guaranteed');
    if (insight.kind === 'estimate') {
      expect([
        'menstrual',
        'follicular',
        'ovulatory',
        'luteal',
        'uncertain',
      ]).toContain(insight.estimatedPhase);
    }
  });

  it('ignores malformed dates rather than throwing', () => {
    const insight = estimateCycleInsight(
      ['2026-13-40', 'not-a-date', '2026-09-01', '2026-09-29'],
      '2026-10-01',
    );
    expect(insight.kind).toBe('estimate');
    if (insight.kind === 'estimate') {
      expect(insight.startCount).toBe(2);
    }
  });
});
