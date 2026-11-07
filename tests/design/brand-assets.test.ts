import appConfig from '../../app.json';
import { brandFonts, useBrandFonts } from '@/design/fonts';
import { colors, fontFamilies } from '@/design/tokens';

describe('brand font pipeline', () => {
  it('exposes a font map and loader hook', () => {
    expect(typeof useBrandFonts).toBe('function');
    expect(typeof brandFonts).toBe('object');
  });

  it('only registers fonts whose keys start with a known family', () => {
    // Guards activation: any added entry must map to a declared brand family.
    const families = Object.values(fontFamilies);
    for (const key of Object.keys(brandFonts)) {
      expect(families.some((family) => key.startsWith(family))).toBe(true);
    }
  });
});

describe('brand app config', () => {
  it('uses the ivory brand background (never pure white)', () => {
    expect(appConfig.expo.backgroundColor).toBe(colors.ivory);
  });

  it('enables the expo-font plugin for brand fonts', () => {
    expect(appConfig.expo.plugins).toContain('expo-font');
  });
});
