import {
  Pressable,
  View,
  type PressableProps,
  type ViewStyle,
} from 'react-native';

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
      style={{ alignSelf: 'flex-start' }}
      {...rest}
    >
      {/* Visual on a plain View, not the style function (#146): a selected
          pill is ivory text and vanished when the fill was not applied. */}
      {({ pressed }) => {
        const face: ViewStyle = {
          minHeight: minTouchTarget,
          justifyContent: 'center',
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.sm,
          borderRadius: radii.pill,
          borderWidth: 1,
          borderColor: selected ? colors.terracotta : colors.mutedSage,
          backgroundColor: selected ? colors.terracotta : 'transparent',
          opacity: disabled ? 0.5 : pressed ? 0.85 : 1,
        };
        return (
          <View style={face}>
            <Typography variant="caption" color={selected ? 'ivory' : 'plum'}>
              {label}
            </Typography>
          </View>
        );
      }}
    </Pressable>
  );
}

export default Pill;
