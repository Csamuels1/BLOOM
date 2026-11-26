import { colors } from '@/design/tokens';
import type { MealSlot } from '@/features/recommendations';

import type { MockMeal } from './mockMeals';

/**
 * Warm, slot-based visual identity for meal cards (issue #152). Purely
 * presentational: a soft accent colour and a small line motif per meal slot.
 * Colours come only from the brand tokens; text never sits on these accents,
 * so plum-on-ivory legibility is unchanged.
 */

export const MEAL_SLOTS = [
  'breakfast',
  'lunch',
  'dinner',
  'snack',
] as const satisfies readonly MealSlot[];

export type MealMotifName = 'sunrise' | 'leaf' | 'bowl' | 'berries' | 'sprig';

export interface MealSlotStyle {
  /** The resolved slot, or 'unknown' when no known slot applies. */
  readonly slot: MealSlot | 'unknown';
  /** Soft accent for the top band and the motif's backdrop. */
  readonly accent: string;
  /** Line colour for the motif. */
  readonly ink: string;
  readonly motif: MealMotifName;
}

const SLOT_STYLES: Record<MealSlot, MealSlotStyle> = {
  breakfast: {
    slot: 'breakfast',
    accent: colors.gold,
    ink: colors.terracotta,
    motif: 'sunrise',
  },
  lunch: {
    slot: 'lunch',
    accent: colors.sage,
    ink: colors.sage,
    motif: 'leaf',
  },
  dinner: {
    slot: 'dinner',
    accent: colors.terracotta,
    ink: colors.plum,
    motif: 'bowl',
  },
  snack: {
    slot: 'snack',
    accent: colors.blush,
    ink: colors.terracotta,
    motif: 'berries',
  },
};

/** Neutral, calm fallback for a missing or unrecognised slot. */
export const FALLBACK_MEAL_SLOT_STYLE: MealSlotStyle = {
  slot: 'unknown',
  accent: colors.mutedSage,
  ink: colors.sage,
  motif: 'sprig',
};

export function isMealSlot(value: unknown): value is MealSlot {
  return (
    typeof value === 'string' &&
    (MEAL_SLOTS as readonly string[]).includes(value)
  );
}

/**
 * The accent and motif for a slot. Accepts any string (the DB column is a
 * nullable string) and falls back safely for anything unrecognised.
 */
export function mealSlotStyle(slot: string | null | undefined): MealSlotStyle {
  return isMealSlot(slot) ? SLOT_STYLES[slot] : FALLBACK_MEAL_SLOT_STYLE;
}

/**
 * Resolve a meal's slot: an explicit slot wins, then the meal's own `slot`
 * (mock meals and catalog meals both carry one). Returns null when unknown, and
 * the card falls back to a neutral accent.
 */
export function resolveMealSlot(
  meal: Pick<MockMeal, 'id'> & { readonly slot?: unknown },
  explicit?: string | null,
): MealSlot | null {
  if (isMealSlot(explicit)) return explicit;
  if (isMealSlot(meal.slot)) return meal.slot;
  return null;
}
