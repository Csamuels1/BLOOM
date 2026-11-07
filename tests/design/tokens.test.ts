import tailwindConfig from '../../tailwind.config.js';
import { colors, minTouchTarget, radii, typography } from '@/design/tokens';

const BRAND = {
  terracotta: '#C97C5D',
  sage: '#8A9A5B',
  ivory: '#FDF8F3',
  plum: '#3B2A35',
  gold: '#D4A373',
  blush: '#E8B4B8',
  mutedSage: '#C8D0B8',
  amber: '#D98E4A',
};

describe('design tokens', () => {
  it('matches the approved brand palette (BRAND_AND_COPY.md)', () => {
    expect(colors).toEqual(BRAND);
  });

  it('exposes only valid 6-digit hex colors', () => {
    for (const value of Object.values(colors)) {
      expect(value).toMatch(/^#[0-9A-F]{6}$/);
    }
  });

  it('uses the documented corner radii', () => {
    expect(radii.button).toBe(12);
    expect(radii.card).toBe(16);
    expect(radii.pill).toBeGreaterThanOrEqual(9999);
  });

  it('meets the minimum accessible touch target', () => {
    expect(minTouchTarget).toBeGreaterThanOrEqual(44);
  });

  it('uses the documented type scale', () => {
    expect(typography.display.fontSize).toBe(32);
    expect(typography.pageTitle.fontSize).toBe(24);
    expect(typography.sectionTitle.fontSize).toBe(18);
    expect(typography.body.fontSize).toBe(15);
    expect(typography.caption.fontSize).toBe(13);
    for (const scale of Object.values(typography)) {
      expect(scale.lineHeight).toBeGreaterThanOrEqual(scale.fontSize);
    }
  });

  it('stays in sync with tailwind.config.js brand colors', () => {
    const tw = (
      tailwindConfig as unknown as {
        theme: { extend: { colors: { bloom: Record<string, string> } } };
      }
    ).theme.extend.colors.bloom;
    expect(tw.terracotta).toBe(colors.terracotta);
    expect(tw.sage).toBe(colors.sage);
    expect(tw.ivory).toBe(colors.ivory);
    expect(tw.plum).toBe(colors.plum);
    expect(tw.gold).toBe(colors.gold);
    expect(tw.blush).toBe(colors.blush);
    expect(tw['muted-sage']).toBe(colors.mutedSage);
    expect(tw.amber).toBe(colors.amber);
  });
});
