import { render, screen } from '@testing-library/react-native';

import { todayCopy as copy, todayDailyNotes } from '@/content/today';
import { useProfileStore } from '@/features/profile';
import { TodayScreen } from '@/features/today';
import {
  calendarDayNumber,
  dailyNoteFor,
  greetingFor,
  timeOfDayFor,
} from '@/features/today/greeting';

// Deterministic motion (and no async act warnings from the accessibility read).
jest.mock('@/design/useReducedMotion', () => ({
  useReducedMotion: () => false,
}));

jest.mock('expo-router', () => ({ router: { navigate: jest.fn() } }));

/** A local date-time (month is 1-based here for readability). */
function at(
  year: number,
  month: number,
  day: number,
  hour = 12,
  minute = 0,
): Date {
  return new Date(year, month - 1, day, hour, minute, 0, 0);
}

describe('timeOfDayFor / greetingFor — boundary hours', () => {
  it.each([
    [0, 0, 'evening'],
    [4, 59, 'evening'],
    [5, 0, 'morning'],
    [11, 59, 'morning'],
    [12, 0, 'afternoon'],
    [16, 59, 'afternoon'],
    [17, 0, 'evening'],
    [23, 59, 'evening'],
  ] as const)('%i:%i is %s', (hour, minute, expected) => {
    expect(timeOfDayFor(at(2026, 11, 26, hour, minute))).toBe(expected);
  });

  it('maps each part of the day to its greeting copy', () => {
    expect(greetingFor(at(2026, 11, 26, 8))).toBe(copy.greetingMorning);
    expect(greetingFor(at(2026, 11, 26, 13))).toBe(copy.greetingAfternoon);
    expect(greetingFor(at(2026, 11, 26, 20))).toBe(copy.greetingEvening);
  });
});

describe('dailyNoteFor — rotation by calendar date', () => {
  it('is stable for the whole of a day', () => {
    const morning = dailyNoteFor(at(2026, 11, 26, 0, 0));
    expect(morning).toBeDefined();
    expect(dailyNoteFor(at(2026, 11, 26, 9, 30))).toBe(morning);
    expect(dailyNoteFor(at(2026, 11, 26, 23, 59))).toBe(morning);
  });

  it('changes across consecutive days (including month and year ends)', () => {
    const pairs: [Date, Date][] = [
      [at(2026, 11, 26), at(2026, 11, 27)],
      [at(2026, 11, 30), at(2026, 12, 1)],
      [at(2026, 12, 31), at(2027, 1, 1)],
      [at(2028, 2, 28), at(2028, 2, 29)],
    ];
    for (const [today, tomorrow] of pairs) {
      expect(dailyNoteFor(tomorrow)).not.toBe(dailyNoteFor(today));
    }
  });

  it('visits every note once per cycle and wraps around', () => {
    const start = at(2026, 11, 26);
    const seen = new Set<string>();
    for (let offset = 0; offset < todayDailyNotes.length; offset += 1) {
      const note = dailyNoteFor(
        at(2026, 11, 26 + offset), // Date normalises overflowing days.
      );
      expect(note).toBeDefined();
      if (note) seen.add(note);
    }
    expect(seen.size).toBe(todayDailyNotes.length);
    expect(dailyNoteFor(at(2026, 11, 26 + todayDailyNotes.length))).toBe(
      dailyNoteFor(start),
    );
  });

  it('handles dates before 1970 and tiny or empty sets safely', () => {
    expect(calendarDayNumber(at(1969, 12, 31))).toBe(-1);
    expect(todayDailyNotes).toContain(dailyNoteFor(at(1969, 12, 31)));
    expect(dailyNoteFor(at(2026, 11, 26), ['only'])).toBe('only');
    expect(dailyNoteFor(at(2026, 11, 26), [])).toBeUndefined();
  });

  it('is unaffected by the time of day a day number is read', () => {
    expect(calendarDayNumber(at(2026, 11, 26, 0, 0))).toBe(
      calendarDayNumber(at(2026, 11, 26, 23, 59)),
    );
    expect(
      calendarDayNumber(at(2026, 11, 27)) - calendarDayNumber(at(2026, 11, 26)),
    ).toBe(1);
  });
});

describe('daily notes — voice', () => {
  // Mirrors tests/copy.test.ts plus the issue #151 exclusions: no body or
  // weight talk, no "bounce back", no streaks, no pressure or fear language.
  const prohibited = [
    'you failed',
    'you went over',
    'stay strong',
    'crush your goals',
    'dream body',
    'before and after',
    'good food',
    'bad food',
    'clean',
    'cheat meal',
    'weight',
    'body',
    'shape',
    'figure',
    'bounce back',
    'snap back',
    'pre-baby',
    'calorie',
    'streak',
    'should',
    'must',
    'need to',
    "don't forget",
    'hurry',
    'behind',
    'lazy',
    'guilt',
  ];

  it('keeps a small reviewed set of short notes', () => {
    expect(todayDailyNotes.length).toBeGreaterThanOrEqual(10);
    expect(todayDailyNotes.length).toBeLessThanOrEqual(14);
    expect(new Set(todayDailyNotes).size).toBe(todayDailyNotes.length);
    for (const note of todayDailyNotes) {
      expect(note.length).toBeLessThanOrEqual(90);
    }
  });

  it.each(todayDailyNotes.map((note) => [note]))(
    'keeps "%s" free of prohibited language',
    (note) => {
      for (const phrase of prohibited) {
        expect(note.toLowerCase()).not.toMatch(new RegExp(`\\b${phrase}\\b`));
      }
    },
  );
});

describe('TodayScreen — greeting and daily note', () => {
  beforeEach(() => {
    useProfileStore.setState({
      profile: {
        country_code: null,
        onboarding_completed_at: '2026-11-12T00:00:00Z',
      } as never,
      status: 'loaded',
    });
  });

  afterEach(() => {
    useProfileStore.setState({ profile: null, status: 'idle' });
  });

  it('greets by the injected clock as a header and shows the day’s note', () => {
    const now = at(2026, 11, 26, 8, 15);
    render(<TodayScreen now={() => now} />);

    expect(
      screen.getByRole('header', { name: copy.greetingMorning }),
    ).toBeOnTheScreen();
    expect(screen.getByText(copy.dailyNoteLabel)).toBeOnTheScreen();
    const note = dailyNoteFor(now);
    if (!note) throw new Error('expected a daily note');
    expect(screen.getByText(note)).toBeOnTheScreen();
    expect(
      screen.getByLabelText(`${copy.dailyNoteLabel}. ${note}`),
    ).toBeOnTheScreen();
    // The existing header is still there.
    expect(screen.getByText(copy.title)).toBeOnTheScreen();
  });

  it('follows the evening and a different day', () => {
    const now = at(2026, 11, 27, 19, 0);
    render(<TodayScreen now={() => now} />);

    expect(
      screen.getByRole('header', { name: copy.greetingEvening }),
    ).toBeOnTheScreen();
    expect(screen.queryByText(copy.greetingMorning)).toBeNull();
    const note = dailyNoteFor(now);
    if (!note) throw new Error('expected a daily note');
    expect(screen.getByText(note)).toBeOnTheScreen();
  });
});
