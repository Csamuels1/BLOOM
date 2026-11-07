import { Text, type TextProps, type TextStyle } from 'react-native';

import {
  colors,
  maxFontSizeMultiplier,
  typography,
  type ColorToken,
  type TypographyVariant,
} from '@/design/tokens';

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
    fontSize: scale.fontSize,
    lineHeight: scale.lineHeight,
    fontWeight: scale.weight,
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
