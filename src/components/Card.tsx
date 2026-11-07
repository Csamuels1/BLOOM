import { View, type ViewProps, type ViewStyle } from 'react-native';

import { colors, radii, spacing } from '@/design/tokens';

export interface CardProps extends ViewProps {
  /** Surface tint. `surface` (muted sage) is the default card background. */
  tone?: 'surface' | 'plain';
}

/**
 * Soft, low-elevation surface for grouping content (docs/BRAND_AND_COPY.md:
 * 16px radius, minimal elevation; pure white is never a default background).
 */
export function Card({ tone = 'surface', style, ...rest }: CardProps) {
  const base: ViewStyle = {
    backgroundColor: tone === 'surface' ? colors.mutedSage : colors.ivory,
    borderRadius: radii.card,
    padding: spacing.lg,
    gap: spacing.sm,
  };

  return <View style={[base, style]} {...rest} />;
}

export default Card;
