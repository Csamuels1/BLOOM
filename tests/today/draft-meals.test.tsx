import { act, render, screen } from '@testing-library/react-native';

import { recommendationsCopy } from '@/content/recommendations';
import { todayCopy as copy } from '@/content/today';
import { useProfileStore } from '@/features/profile';
import { TodayScreen } from '@/features/today';
import {
  DRAFT_CATALOG,
  type DraftMeal,
} from '@/features/today/draftCatalog.generated';
import {
  avoidAllergensFor,
  criteriaForProfile,
  loadDraftCatalog,
  resolveAppEnv,
  selectDraftMealsForDate,
  type DraftProfileInput,
} from '@/features/today/draftMeals';
import { mockMealsForRegion } from '@/features/today/mockMeals';

jest.mock('@/design/useReducedMotion', () => ({
  useReducedMotion: () => false,
}));
jest.mock('expo-router', () => ({ router: { navigate: jest.fn() } }));

/** Local calendar dates (month is 1-based here for readability). */
function localDate(year: number, month: number, day: number, hour = 12): Date {
  return new Date(year, month - 1, day, hour, 0, 0);
}

function picksFor(profile: DraftProfileInput | null, date: Date) {
  return selectDraftMealsForDate(
    DRAFT_CATALOG,
    criteriaForProfile(profile),
    date,
  );
}

function mealIds(profile: DraftProfileInput | null, date: Date): string[] {
  return picksFor(profile, date).map((pick) => pick.meal?.id ?? 'gap');
}

const NIGERIA: DraftProfileInput = { country_code: 'NG' };
const US: DraftProfileInput = { country_code: 'US' };

describe('draft catalog dataset (#159)', () => {
  it('holds the 56 unreviewed draft meals: 28 Nigerian and 28 US', () => {
    expect(DRAFT_CATALOG).toHaveLength(56);
    const count = (region: DraftMeal['region']) =>
      DRAFT_CATALOG.filter((meal) => meal.region === region).length;
    expect(count('nigeria')).toBe(28);
    expect(count('united_states')).toBe(28);
    expect(new Set(DRAFT_CATALOG.map((meal) => meal.id)).size).toBe(56);
  });
});

describe('production gate (#159)', () => {
  it('yields no draft meals for the production config', () => {
    expect(loadDraftCatalog('production')).toEqual([]);
  });

  it('never even loads the draft dataset module in production', () => {
    let loads = 0;
    jest.isolateModules(() => {
      jest.doMock('@/features/today/draftCatalog.generated', () => {
        loads += 1;
        return { DRAFT_CATALOG: [] };
      });
      const gate = jest.requireActual<
        typeof import('@/features/today/draftMeals')
      >('@/features/today/draftMeals');
      expect(gate.loadDraftCatalog('production')).toEqual([]);
      expect(loads).toBe(0);
      gate.loadDraftCatalog('staging');
      expect(loads).toBe(1);
    });
    // Explicit mocks outlive isolateModules; restore the real dataset.
    jest.dontMock('@/features/today/draftCatalog.generated');
  });

  it('serves the drafts in local and staging builds', () => {
    expect(loadDraftCatalog('local')).toHaveLength(56);
    expect(loadDraftCatalog('staging')).toHaveLength(56);
  });

  it('reads the environment like src/config/env.ts and fails closed', () => {
    expect(resolveAppEnv('production')).toBe('production');
    expect(resolveAppEnv('staging')).toBe('staging');
    // Unset fails closed too: a build must opt in to drafts explicitly.
    expect(resolveAppEnv(undefined)).toBe('production');
    // A typo can only hide drafts, never show them.
    expect(resolveAppEnv('prod')).toBe('production');
    expect(resolveAppEnv('')).toBe('production');
  });

  it('keeps the reviewed meals and shows no draft label in production', () => {
    useProfileStore.setState({
      profile: {
        country_code: 'NG',
        onboarding_completed_at: '2026-11-12T00:00:00Z',
      } as never,
      status: 'loaded',
    });
    render(
      <TodayScreen appEnv="production" now={() => localDate(2026, 11, 26)} />,
    );
    expect(screen.queryByText(copy.draftMealsLabel)).toBeNull();
    for (const meal of mockMealsForRegion('nigeria')) {
      expect(screen.getByRole('button', { name: meal.name })).toBeOnTheScreen();
    }
    for (const meal of DRAFT_CATALOG) {
      expect(screen.queryByText(meal.name)).toBeNull();
    }
    act(() => {
      useProfileStore.setState({ profile: null, status: 'idle' });
    });
  });
});

describe('daily rotation (#159)', () => {
  it('picks one meal per slot, snack included, for the region', () => {
    const picks = picksFor(NIGERIA, localDate(2026, 11, 26));
    expect(picks.map((pick) => pick.slot)).toEqual([
      'breakfast',
      'lunch',
      'dinner',
      'snack',
    ]);
    for (const pick of picks) {
      expect(pick.meal?.slot).toBe(pick.slot);
      expect(pick.gap).toBeNull();
    }
  });

  it('is stable all day, from just after midnight to just before', () => {
    for (const profile of [NIGERIA, US]) {
      const early = mealIds(profile, localDate(2026, 11, 26, 0));
      expect(mealIds(profile, localDate(2026, 11, 26, 12))).toEqual(early);
      expect(mealIds(profile, new Date(2026, 10, 26, 23, 59, 59, 999))).toEqual(
        early,
      );
    }
  });

  it('changes every slot on consecutive days when the pool allows', () => {
    for (const profile of [NIGERIA, US]) {
      for (let day = 1; day <= 14; day += 1) {
        const today = mealIds(profile, localDate(2026, 11, day));
        const tomorrow = mealIds(profile, localDate(2026, 11, day + 1));
        today.forEach((id, slot) => expect(tomorrow[slot]).not.toBe(id));
      }
    }
  });

  it('works across a month and year boundary', () => {
    expect(mealIds(US, localDate(2026, 12, 31))).not.toEqual(
      mealIds(US, localDate(2027, 1, 1)),
    );
  });

  it('only offers drafts as a snack slot when the catalog has snacks', () => {
    const noSnacks = DRAFT_CATALOG.filter((meal) => meal.slot !== 'snack');
    const picks = selectDraftMealsForDate(
      noSnacks,
      criteriaForProfile(US),
      localDate(2026, 11, 26),
    );
    expect(picks.map((pick) => pick.slot)).toEqual([
      'breakfast',
      'lunch',
      'dinner',
    ]);
  });
});

describe('region selection (#159)', () => {
  it('serves the Nigerian catalog to Nigeria and the US catalog otherwise', () => {
    const regionsFor = (profile: DraftProfileInput | null) =>
      new Set(
        Array.from({ length: 10 }, (_, day) =>
          picksFor(profile, localDate(2026, 11, day + 1)),
        )
          .flat()
          .map((pick) => pick.meal?.region),
      );
    expect(regionsFor(NIGERIA)).toEqual(new Set(['nigeria']));
    // 'general' (any other country, or none yet) maps to the US catalog.
    for (const profile of [US, { country_code: 'GB' }, null]) {
      expect(regionsFor(profile)).toEqual(new Set(['united_states']));
    }
  });
});

describe('allergen safety (#159)', () => {
  // Profile vocabulary (onboarding) -> the catalog allergen it must exclude.
  const PROFILE_TO_CATALOG: Record<string, string> = {
    peanut: 'peanuts',
    tree_nut: 'tree_nuts',
    milk: 'dairy',
    wheat: 'gluten',
    egg: 'egg',
    soy: 'soy',
    fish: 'fish',
    shellfish: 'shellfish',
  };

  it.each(Object.entries(PROFILE_TO_CATALOG))(
    'a user avoiding %s never sees a meal containing %s',
    (profileAllergen, catalogAllergen) => {
      for (const country of ['NG', 'US']) {
        for (let day = 0; day < 60; day += 1) {
          const picks = picksFor(
            { country_code: country, allergens: [profileAllergen] },
            localDate(2026, 11, 1 + day),
          );
          for (const pick of picks) {
            expect(pick.meal?.allergens ?? []).not.toContain(catalogAllergen);
          }
        }
      }
    },
  );

  it('also honours catalog-vocabulary and mixed-case allergen values', () => {
    for (let day = 0; day < 30; day += 1) {
      const picks = picksFor(
        { country_code: 'NG', allergens: [' Peanuts ', 'SHELLFISH'] },
        localDate(2026, 11, 1 + day),
      );
      for (const pick of picks) {
        expect(pick.meal?.allergens ?? []).not.toContain('peanuts');
        expect(pick.meal?.allergens ?? []).not.toContain('shellfish');
      }
    }
  });

  it('treats a low-dairy preference as avoiding dairy', () => {
    expect(avoidAllergensFor({ dietary_preferences: ['low_dairy'] })).toEqual([
      'dairy',
    ]);
  });

  it('leaves an honest gap rather than an unsafe fill when nothing is safe', () => {
    // Every breakfast now contains peanuts, so a peanut-allergic user has none.
    const onlyPeanutBreakfast = DRAFT_CATALOG.map((meal) =>
      meal.slot === 'breakfast'
        ? { ...meal, allergens: [...meal.allergens, 'peanuts'] }
        : meal,
    );
    const picks = selectDraftMealsForDate(
      onlyPeanutBreakfast,
      criteriaForProfile({ country_code: 'US', allergens: ['peanut'] }),
      localDate(2026, 11, 26),
    );
    const breakfast = picks.find((pick) => pick.slot === 'breakfast');
    expect(breakfast?.meal).toBeNull();
    expect(breakfast?.gap).toBe(recommendationsCopy.gapNoSafeMeal);
  });
});

describe('dietary preferences and goal (#159)', () => {
  it('a vegan sees only vegan meals; a vegetarian also sees vegan ones', () => {
    for (let day = 0; day < 14; day += 1) {
      const date = localDate(2026, 11, 1 + day);
      for (const pick of picksFor(
        { country_code: 'NG', dietary_preferences: ['vegan'] },
        date,
      )) {
        if (pick.meal) expect(pick.meal.dietary_tags).toContain('vegan');
      }
      for (const pick of picksFor(
        { country_code: 'NG', dietary_preferences: ['vegetarian'] },
        date,
      )) {
        if (pick.meal) {
          expect(
            pick.meal.dietary_tags.some(
              (tag) => tag === 'vegetarian' || tag === 'vegan',
            ),
          ).toBe(true);
        }
      }
    }
  });

  it('uses the profile goal, defaulting to maintenance', () => {
    expect(criteriaForProfile({ goal: 'gain' }).goal).toBe('gain');
    expect(criteriaForProfile({ goal: 'unknown' }).goal).toBe('maintenance');
    expect(criteriaForProfile(null).goal).toBe('maintenance');
    for (const pick of picksFor(
      { country_code: 'US', goal: 'gain' },
      localDate(2026, 11, 26),
    )) {
      if (pick.meal) expect(pick.meal.goals).toContain('gain');
    }
  });
});

describe('Today with draft meals (#159)', () => {
  afterEach(() => {
    act(() => {
      useProfileStore.setState({ profile: null, status: 'idle' });
    });
  });

  function setLoaded(profile: Record<string, unknown>) {
    useProfileStore.setState({
      profile: {
        onboarding_completed_at: '2026-11-12T00:00:00Z',
        ...profile,
      } as never,
      status: 'loaded',
    });
  }

  it("labels the drafts calmly and shows the day's rotated meals", () => {
    setLoaded({ country_code: 'NG', allergens: ['peanut'] });
    const date = localDate(2026, 11, 26);
    render(<TodayScreen appEnv="staging" now={() => date} />);

    expect(screen.getByText(copy.draftMealsLabel)).toBeOnTheScreen();
    const expected = picksFor(
      { country_code: 'NG', allergens: ['peanut'] },
      date,
    );
    expect(expected).toHaveLength(4);
    for (const pick of expected) {
      if (!pick.meal) throw new Error('expected a meal in every slot');
      expect(
        screen.getByRole('button', { name: pick.meal.name }),
      ).toBeOnTheScreen();
      // Slot accents are kept: each card renders its slot's band.
      expect(
        screen.getAllByTestId(`meal-slot-band-${pick.meal.slot}`, {
          includeHiddenElements: true,
        }).length,
      ).toBeGreaterThan(0);
    }
    for (const meal of mockMealsForRegion('nigeria')) {
      expect(screen.queryByRole('button', { name: meal.name })).toBeNull();
    }
  });

  it('shows the label only alongside drafts, not while loading', () => {
    useProfileStore.setState({ profile: null, status: 'loading' });
    render(
      <TodayScreen appEnv="staging" now={() => localDate(2026, 11, 26)} />,
    );
    expect(screen.queryByText(copy.draftMealsLabel)).toBeNull();
  });

  it('shows different meals on the next day', () => {
    setLoaded({ country_code: 'US' });
    const today = picksFor(US, localDate(2026, 11, 26));
    const tomorrow = picksFor(US, localDate(2026, 11, 27));
    render(<TodayScreen appEnv="local" now={() => localDate(2026, 11, 27)} />);
    for (const pick of tomorrow) {
      if (pick.meal) {
        expect(
          screen.getByRole('button', { name: pick.meal.name }),
        ).toBeOnTheScreen();
      }
    }
    for (const pick of today) {
      if (pick.meal) {
        expect(
          screen.queryByRole('button', { name: pick.meal.name }),
        ).toBeNull();
      }
    }
  });
});
