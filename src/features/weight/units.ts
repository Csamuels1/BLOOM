// Weight unit conversion (issue #25). Kilograms are the canonical, stored unit
// (the weight_measurements schema stores weight_kg); pounds are a display-only
// convenience. These helpers are pure so they are trivial to test and reuse.

/** The app's two measurement systems (mirrors onboarding UNIT_SYSTEMS). */
export type UnitSystem = 'metric' | 'imperial';

/** Pounds per kilogram (exact, by international definition). */
const LB_PER_KG = 2.2046226218487757;

/** Round to a fixed number of decimals without floating-point noise. */
function roundTo(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  // +Number.EPSILON nudges exact halves (e.g. 0.15) to round as a human expects.
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

/** Convert kilograms to pounds, rounded to one decimal for display. */
export function kgToLb(kg: number): number {
  return roundTo(kg * LB_PER_KG, 1);
}

/** Convert pounds to kilograms, rounded to two decimals (schema is numeric(5,2)). */
export function lbToKg(lb: number): number {
  return roundTo(lb / LB_PER_KG, 2);
}

/** The display unit abbreviation for a system. */
export function unitLabel(system: UnitSystem): string {
  return system === 'imperial' ? 'lb' : 'kg';
}

/**
 * Take a canonical weight in kg and produce the number to show in the given
 * unit system, rounded sensibly (1 decimal). Metric shows the kg value; imperial
 * converts to pounds.
 */
export function kgToDisplay(kg: number, system: UnitSystem): number {
  return system === 'imperial' ? kgToLb(kg) : roundTo(kg, 1);
}

/** Format a canonical kg weight as a display string, e.g. "68.2 kg" or "150.4 lb". */
export function formatWeight(kg: number, system: UnitSystem): string {
  return `${kgToDisplay(kg, system)} ${unitLabel(system)}`;
}

/**
 * Parse a user-entered weight string (in the given unit system) into canonical
 * kilograms. Returns null when the input is blank or not a positive finite
 * number, so callers can keep the field untouched and show a gentle message
 * rather than discarding what the user typed.
 */
export function parseToKg(input: string, system: UnitSystem): number | null {
  const trimmed = input.trim().replace(',', '.');
  if (trimmed === '') {
    return null;
  }
  const value = Number(trimmed);
  if (!Number.isFinite(value) || value <= 0) {
    return null;
  }
  return system === 'imperial' ? lbToKg(value) : roundTo(value, 2);
}
