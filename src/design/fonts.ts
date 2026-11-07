import { useFonts } from 'expo-font';

/**
 * Brand font loading pipeline (issue #6).
 *
 * The approved Fraunces/Manrope font files are supplied and approved by the
 * owner (see assets/brand/README.md for the exact files and the activation
 * steps). Until they are added, this map is intentionally empty: `useFonts({})`
 * resolves immediately, so the app renders with system fonts at the correct
 * sizes/weights and nothing breaks in the bundle or export.
 *
 * To activate once the files exist, uncomment the entries below. The keys must
 * match `fontFamilies` in tokens.ts (Fraunces, Manrope) plus weight suffixes.
 */
export const brandFonts: Record<string, number> = {
  // Fraunces: require('../../assets/fonts/Fraunces-SemiBold.ttf'),
  // Manrope: require('../../assets/fonts/Manrope-Regular.ttf'),
  // 'Manrope-Medium': require('../../assets/fonts/Manrope-Medium.ttf'),
  // 'Manrope-SemiBold': require('../../assets/fonts/Manrope-SemiBold.ttf'),
};

/** True once brand fonts have loaded (immediately true while the map is empty). */
export function useBrandFonts(): boolean {
  const [loaded] = useFonts(brandFonts);
  return loaded;
}

export default useBrandFonts;
