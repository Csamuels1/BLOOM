import {
  distinctWeeks,
  earnedMilestones,
} from '@/features/progress/milestones';

const reading = (measured_at: string) => ({ measured_at, weight_kg: 70 });

describe('distinctWeeks', () => {
  it('counts distinct calendar weeks, not entries', () => {
    expect(
      distinctWeeks([
        reading('2021-01-04'),
        reading('2021-01-05'), // same week
        reading('2021-01-11'), // next week
      ]),
    ).toBe(2);
  });
});

describe('earnedMilestones', () => {
  it('has no milestones with no entries', () => {
    expect(earnedMilestones([])).toEqual([]);
  });

  it('earns the first-entry milestone from a single week', () => {
    expect(earnedMilestones([reading('2021-01-04')]).map((m) => m.id)).toEqual([
      'first_entry',
    ]);
  });

  it('counts non-consecutive weeks — gaps never remove a milestone', () => {
    // Four distinct weeks with a deliberate gap between them.
    const readings = [
      reading('2021-01-04'),
      reading('2021-01-18'), // skipped a week
      reading('2021-02-01'),
      reading('2021-02-15'),
    ];
    const ids = earnedMilestones(readings).map((m) => m.id);
    expect(ids).toContain('first_entry');
    expect(ids).toContain('weeks_2');
    expect(ids).toContain('weeks_4');
    expect(ids).not.toContain('weeks_8');
  });
});
