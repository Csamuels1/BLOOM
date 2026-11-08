import { useFonts } from 'expo-font';

/**
 * Brand font loading pipeline (issue #6).
 *
 * Registers the approved, OFL-licensed Fraunces (display) and Manrope (body)
 * faces. Keys are the family names components reference via FONT_FAMILY in
 * Typography.tsx. `_layout.tsx` holds the first frame until these resolve.
 */
export const brandFonts: Record<string, number> = {
  Fraunces: require('../../assets/fonts/Fraunces-SemiBold.ttf'),
  Manrope: require('../../assets/fonts/Manrope-Regular.ttf'),
  'Manrope-Medium': require('../../assets/fonts/Manrope-Medium.ttf'),
  'Manrope-SemiBold': require('../../assets/fonts/Manrope-SemiBold.ttf'),
};

/** True once brand fonts have loaded (immediately true while the map is empty). */
export function useBrandFonts(): boolean {
  const [loaded] = useFonts(brandFonts);
  return loaded;
}

export default useBrandFonts;
