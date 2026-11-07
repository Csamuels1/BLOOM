import { Pressable, type PressableProps, type ViewStyle } from 'react-native';

import { colors, minTouchTarget, radii, spacing } from '@/design/tokens';

import { Typography } from './Typography';

export interface PillProps extends Omit<
  PressableProps,
  'children' | 'style' | 'disabled'
> {
  label: string;
  /** Selected (filled) vs unselected (outlined). */
  selected?: boolean;
  disabled?: boolean;
}

/**
 * Fully-rounded selectable chip for choices and filters (docs/BRAND_AND_COPY.md:
 * pills use full radius). Exposes its selected state to assistive tech.
 */
export function Pill({
  label,
  selected = false,
  disabled = false,
  accessibilityLabel,
  ...rest
}: PillProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ selected, disabled }}
      disabled={disabled}
      hitSlop={8}
      style={({ pressed }): ViewStyle => ({
        minHeight: minTouchTarget,
        alignSelf: 'flex-start',
        justifyContent: 'center',
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.sm,
        borderRadius: radii.pill,
        borderWidth: 1,
        borderColor: selected ? colors.terracotta : colors.mutedSage,
        backgroundColor: selected ? colors.terracotta : 'transparent',
        opacity: disabled ? 0.5 : pressed ? 0.85 : 1,
      })}
      {...rest}
    >
      <Typography variant="caption" color={selected ? 'ivory' : 'plum'}>
        {label}
      </Typography>
    </Pressable>
  );
}

export default Pill;
