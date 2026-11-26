import { fireEvent, render, screen } from '@testing-library/react-native';

import { todayCopy as copy } from '@/content/today';
import { colors } from '@/design/tokens';
import { MealCard } from '@/features/today/MealCard';
import {
  FALLBACK_MEAL_SLOT_STYLE,
  MEAL_SLOTS,
  mealSlotStyle,
  resolveMealSlot,
} from '@/features/today/mealSlotStyle';
import { mockMealsForRegion, type MockMeal } from '@/features/today/mockMeals';

jest.mock('@/design/useReducedMotion', () => ({
  useReducedMotion: () => true,
}));

jest.mock('@/features/telemetry', () => ({ track: jest.fn(async () => true) }));

// The first jest-expo render in a suite pays a one-time warm-up.
jest.setTimeout(20000);

const meal: MockMeal = {
  id: 'test-meal',
  name: 'Warm lentil soup',
  region: 'general',
  slot: 'lunch',
  calories: { min: 300, max: 400 },
  tags: ['Comforting'],
  ingredients: 'Red lentils, carrot, onion, stock.',
};

const hidden = { includeHiddenElements: true } as const;

describe('mealSlotStyle', () => {
  it('gives each slot its own brand accent and motif', () => {
    expect(mealSlotStyle('breakfast')).toMatchObject({
      accent: colors.gold,
      motif: 'sunrise',
    });
    expect(mealSlotStyle('lunch')).toMatchObject({
      accent: colors.sage,
      motif: 'leaf',
    });
    expect(mealSlotStyle('dinner')).toMatchObject({
      accent: colors.terracotta,
      motif: 'bowl',
    });
    expect(mealSlotStyle('snack')).toMatchObject({
      accent: colors.blush,
      motif: 'berries',
    });
    const motifs = new Set(MEAL_SLOTS.map((slot) => mealSlotStyle(slot).motif));
    expect(motifs.size).toBe(MEAL_SLOTS.length);
  });

  it('uses only palette tokens and never the safety amber', () => {
    const palette = Object.values(colors) as string[];
    for (const style of [
      ...MEAL_SLOTS.map((slot) => mealSlotStyle(slot)),
      FALLBACK_MEAL_SLOT_STYLE,
    ]) {
      expect(palette).toContain(style.accent);
      expect(palette).toContain(style.ink);
      expect(style.accent).not.toBe(colors.amber);
      expect(style.ink).not.toBe(colors.amber);
    }
  });

  it.each([null, undefined, '', 'brunch', 'BREAKFAST'])(
    'falls back safely for an unknown slot (%p)',
    (slot) => {
      expect(mealSlotStyle(slot)).toBe(FALLBACK_MEAL_SLOT_STYLE);
    },
  );
});

describe('resolveMealSlot', () => {
  it("prefers an explicit slot, then the meal's own slot", () => {
    expect(resolveMealSlot({ id: 'general-1', slot: 'dinner' }, 'snack')).toBe(
      'snack',
    );
    expect(resolveMealSlot({ id: 'general-1', slot: 'dinner' })).toBe('dinner');
    // No guessing from ids or order (#152 review: jollof is not breakfast).
    expect(resolveMealSlot({ id: 'general-1' })).toBeNull();
  });

  it('returns null when nothing identifies the slot', () => {
    expect(resolveMealSlot({ id: 'test-meal' })).toBeNull();
    expect(resolveMealSlot({ id: 'general-9', slot: 'brunch' })).toBeNull();
  });

  it('gives every mock meal a known slot', () => {
    for (const region of ['general', 'nigeria'] as const) {
      const slots = mockMealsForRegion(region).map((m) => resolveMealSlot(m));
      expect(slots).not.toContain(null);
      expect(new Set(slots).size).toBe(3);
    }
  });
});

describe('MealCard slot identity', () => {
  it.each(MEAL_SLOTS)('renders the %s band and motif', (slot) => {
    render(<MealCard meal={meal} slot={slot} onLog={jest.fn()} />);
    const style = mealSlotStyle(slot);
    expect(screen.getByTestId(`meal-slot-band-${slot}`, hidden)).toHaveStyle({
      backgroundColor: style.accent,
    });
    expect(
      screen.getByTestId(`meal-motif-${style.motif}`, hidden),
    ).toBeTruthy();
  });

  it('falls back to the calm sprig for an unknown slot', () => {
    const unknownSlotMeal = { ...meal, slot: 'brunch' } as unknown as MockMeal;
    render(<MealCard meal={unknownSlotMeal} slot="brunch" onLog={jest.fn()} />);
    expect(screen.getByTestId('meal-slot-band-unknown', hidden)).toHaveStyle({
      backgroundColor: colors.mutedSage,
    });
    expect(screen.getByTestId('meal-motif-sprig', hidden)).toBeTruthy();
  });

  it('keeps the decorative art hidden from assistive tech', () => {
    render(<MealCard meal={meal} slot="dinner" onLog={jest.fn()} />);
    expect(screen.queryByTestId('meal-motif-bowl')).toBeNull();
    expect(screen.queryByTestId('meal-slot-band-dinner')).toBeNull();
    for (const id of ['meal-motif-bowl', 'meal-slot-band-dinner']) {
      const node = screen.getByTestId(id, hidden);
      expect(node.props.accessible).toBe(false);
      expect(node.props.accessibilityElementsHidden).toBe(true);
      expect(node.props.importantForAccessibility).toBe('no-hide-descendants');
    }
  });

  it('keeps the label, hint, expanded state, secondary calories and log action', () => {
    const onLog = jest.fn();
    render(<MealCard meal={meal} slot="lunch" onLog={onLog} />);

    const card = screen.getByRole('button', { name: meal.name });
    expect(card.props.accessibilityHint).toBe(copy.mealExpandHint);
    expect(card).toHaveProp('accessibilityState', { expanded: false });
    expect(
      screen.getByText(
        `${copy.mealCaloriesLabel} ${meal.calories.min}–${meal.calories.max} ${copy.mealCaloriesUnit}`,
      ),
    ).toBeOnTheScreen();
    expect(screen.queryByText(meal.ingredients)).toBeNull();

    fireEvent.press(card);
    expect(screen.getByRole('button', { name: meal.name })).toHaveProp(
      'accessibilityState',
      { expanded: true },
    );
    expect(screen.getByText(meal.ingredients)).toBeOnTheScreen();

    fireEvent.press(screen.getByRole('button', { name: copy.mealLog }));
    expect(onLog).toHaveBeenCalledTimes(1);
  });
});
