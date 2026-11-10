import { getLocales } from 'expo-localization';

import type { UnitSystem } from './schema';

/**
 * Device locale defaults for onboarding (issue #15). Derived from the OS locale
 * only — never from GPS or precise location (docs/ADR-0003). Both values are
 * overridable by the user on the region/units step.
 */
export function localeDefaults(): {
  countryCode: string | undefined;
  unitSystem: UnitSystem;
} {
  try {
    const locale = getLocales()[0];
    const regionCode = locale?.regionCode ?? undefined;
    // measurementSystem is 'us' | 'uk' | 'metric'; only US defaults to imperial.
    const unitSystem: UnitSystem =
      locale?.measurementSystem === 'us' ? 'imperial' : 'metric';
    return {
      countryCode: regionCode ? regionCode.toUpperCase() : undefined,
      unitSystem,
    };
  } catch {
    return { countryCode: undefined, unitSystem: 'metric' };
  }
}
