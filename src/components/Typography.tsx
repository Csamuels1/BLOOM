import { Text, type TextProps, type TextStyle } from 'react-native';

import {
  colors,
  maxFontSizeMultiplier,
  typography,
  type ColorToken,
  type TypographyVariant,
} from '@/design/tokens';

/**
 * Maps each variant to a loaded brand face (see src/design/fonts.ts). Each face
 * already carries its weight, so components set fontFamily rather than
 * fontWeight (which would risk faux-bold). Falls back to system fonts if a face
 * has not loaded.
 */
const FONT_FAMILY: Record<TypographyVariant, string> = {
  display: 'Fraunces',
  pageTitle: 'Fraunces',
  sectionTitle: 'Manrope-SemiBold',
  body: 'Manrope',
  caption: 'Manrope-Medium',
};

export interface TypographyProps extends TextProps {
  /** Type scale entry. Defaults to `body`. */
  variant?: TypographyVariant;
  /** Brand color token for the text. Defaults to primary text (plum). */
  color?: ColorToken;
}

/**
 * Base themed text. Honors dynamic type (scales up to maxFontSizeMultiplier)
 * and stays a plain Text otherwise. Prefer the named variants below.
 */
export function Typography({
  variant = 'body',
  color = 'plum',
  style,
  ...rest
}: TypographyProps) {
  const scale = typography[variant];
  const resolved: TextStyle = {
    fontFamily: FONT_FAMILY[variant],
    fontSize: scale.fontSize,
    lineHeight: scale.lineHeight,
    color: colors[color],
  };

  return (
    <Text
      allowFontScaling
      maxFontSizeMultiplier={maxFontSizeMultiplier}
      style={[resolved, style]}
      {...rest}
    />
  );
}

export const Display = (props: Omit<TypographyProps, 'variant'>) => (
  <Typography accessibilityRole="header" variant="display" {...props} />
);

export const PageTitle = (props: Omit<TypographyProps, 'variant'>) => (
  <Typography accessibilityRole="header" variant="pageTitle" {...props} />
);

export const SectionTitle = (props: Omit<TypographyProps, 'variant'>) => (
  <Typography accessibilityRole="header" variant="sectionTitle" {...props} />
);

export const Body = (props: Omit<TypographyProps, 'variant'>) => (
  <Typography variant="body" {...props} />
);

export const Caption = (props: Omit<TypographyProps, 'variant'>) => (
  <Typography variant="caption" {...props} />
);

export default Typography;
