import {
  summarizeTrend,
  toWeeklyAverages,
  weekStartOf,
  type WeeklyPoint,
} from '@/features/progress/weeklyAverages';

describe('weekStartOf', () => {
  it('returns the Monday that starts the week', () => {
    expect(weekStartOf('2021-01-04')).toBe('2021-01-04'); // a Monday
    expect(weekStartOf('2021-01-07')).toBe('2021-01-04'); // Thursday → same week
    expect(weekStartOf('2021-01-03')).toBe('2020-12-28'); // Sunday → previous Monday
  });
});

describe('toWeeklyAverages', () => {
  it('averages multiple entries in a week (smoothing daily spikes)', () => {
    const points = toWeeklyAverages([
      { measured_at: '2021-01-04', weight_kg: 70 },
      { measured_at: '2021-01-06', weight_kg: 72 }, // same week → avg 71
      { measured_at: '2021-01-11', weight_kg: 69 }, // next week
    ]);
    expect(points).toEqual<WeeklyPoint[]>([
      { weekStart: '2021-01-04', averageKg: 71, count: 2 },
      { weekStart: '2021-01-11', averageKg: 69, count: 1 },
    ]);
  });

  it('orders weeks oldest first regardless of input order', () => {
    const points = toWeeklyAverages([
      { measured_at: '2021-02-01', weight_kg: 68 },
      { measured_at: '2021-01-04', weight_kg: 70 },
    ]);
    expect(points.map((p) => p.weekStart)).toEqual([
      '2021-01-04',
      '2021-02-01',
    ]);
  });

  it('returns nothing for no readings', () => {
    expect(toWeeklyAverages([])).toEqual([]);
  });
});

describe('summarizeTrend', () => {
  const mk = (kgs: number[]): WeeklyPoint[] =>
    kgs.map((averageKg, i) => ({
      weekStart: `2021-01-${String(4 + i * 7).padStart(2, '0')}`,
      averageKg,
      count: 1,
    }));

  it('reports insufficient data with fewer than two weeks', () => {
    expect(summarizeTrend(mk([70])).direction).toBe('insufficient');
    expect(summarizeTrend([]).direction).toBe('insufficient');
  });

  it('calls small net change steady, not a trend', () => {
    expect(summarizeTrend(mk([70, 70.3])).direction).toBe('steady');
  });

  it('describes a clear decrease and increase neutrally', () => {
    expect(summarizeTrend(mk([72, 70])).direction).toBe('down');
    expect(summarizeTrend(mk([70, 72])).direction).toBe('up');
  });

  it('exposes endpoints and signed change', () => {
    const trend = summarizeTrend(mk([72, 70]));
    expect(trend.firstKg).toBe(72);
    expect(trend.lastKg).toBe(70);
    expect(trend.changeKg).toBe(-2);
    expect(trend.weeks).toBe(2);
  });
});
