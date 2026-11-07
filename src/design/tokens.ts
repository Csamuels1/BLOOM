/**
 * BLOOM design tokens — the single source of truth for approved visual values.
 *
 * Values mirror docs/BRAND_AND_COPY.md. tailwind.config.js consumes the same
 * values via brandColors/radii/etc.; tests/design/tokens.test.ts guards the two
 * against drift. Do not hardcode brand hex values in components — import these.
 */

/** Approved brand palette (docs/BRAND_AND_COPY.md). */
export const colors = {
  /** Primary actions and warmth. */
  terracotta: '#C97C5D',
  /** Growth and positive states. */
  sage: '#8A9A5B',
  /** Default app background (pure white is never a default background). */
  ivory: '#FDF8F3',
  /** Primary text. */
  plum: '#3B2A35',
  /** Highlights and gentle celebrations. */
  gold: '#D4A373',
  /** Soft emphasis. */
  blush: '#E8B4B8',
  /** Cards and subtle surfaces. */
  mutedSage: '#C8D0B8',
  /** Genuine safety notices only — never for calories, weight, or ordinary errors. */
  amber: '#D98E4A',
} as const;

/** Semantic aliases so components express intent, not raw color names. */
export const semanticColors = {
  background: colors.ivory,
  textPrimary: colors.plum,
  primary: colors.terracotta,
  onPrimary: colors.ivory,
  positive: colors.sage,
  surface: colors.mutedSage,
  accent: colors.gold,
  softEmphasis: colors.blush,
  caution: colors.amber,
} as const;

/** 4px spacing scale. */
export const spacing = {
  none: 0,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

/** Corner radii (docs/BRAND_AND_COPY.md): cards 16, buttons 12, pills full. */
export const radii = {
  button: 12,
  card: 16,
  pill: 9999,
} as const;

/**
 * Minimum interactive target. 48dp satisfies platform accessibility guidance
 * (>= WCAG 2.5.5 AAA 44px) and matches the existing welcome-screen controls.
 */
export const minTouchTarget = 48;

/**
 * Font families (docs/BRAND_AND_COPY.md). The font files are added and loaded in
 * the brand-assets work (issue #6); until then components render with system
 * fonts using the sizes and weights below. Keep these names stable so loading
 * them later is a one-line change.
 */
export const fontFamilies = {
  display: 'Fraunces',
  body: 'Manrope',
} as const;

/** Type scale. `family` is advisory until fonts load (see fontFamilies). */
export const typography = {
  display: { fontSize: 32, lineHeight: 40, weight: '600', family: 'display' },
  pageTitle: { fontSize: 24, lineHeight: 32, weight: '600', family: 'display' },
  sectionTitle: {
    fontSize: 18,
    lineHeight: 26,
    weight: '600',
    family: 'body',
  },
  body: { fontSize: 15, lineHeight: 22, weight: '400', family: 'body' },
  caption: { fontSize: 13, lineHeight: 18, weight: '500', family: 'body' },
} as const;

/**
 * Cap runaway dynamic-type scaling so layouts stay usable while still honoring
 * the reader's preferred text size. Text remains fully scalable up to this.
 */
export const maxFontSizeMultiplier = 2;

export type ColorToken = keyof typeof colors;
export type TypographyVariant = keyof typeof typography;

export const tokens = {
  colors,
  semanticColors,
  spacing,
  radii,
  minTouchTarget,
  fontFamilies,
  typography,
  maxFontSizeMultiplier,
} as const;

export default tokens;
