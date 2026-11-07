import {
  ActivityIndicator,
  Pressable,
  View,
  type PressableProps,
  type ViewStyle,
} from 'react-native';

import { useReducedMotion } from '@/design/useReducedMotion';
import { colors, minTouchTarget, radii, spacing } from '@/design/tokens';

import { Typography } from './Typography';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost';

export interface ButtonProps extends Omit<
  PressableProps,
  'children' | 'style' | 'disabled'
> {
  /** Visible, voice-reviewed label. Also the default accessibility label. */
  label: string;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  /** Optional leading element (e.g. an icon). */
  icon?: React.ReactNode;
}

const palette: Record<
  ButtonVariant,
  { background: string; border: string; text: keyof typeof colors }
> = {
  primary: { background: colors.plum, border: colors.plum, text: 'ivory' },
  secondary: {
    background: 'transparent',
    border: colors.terracotta,
    text: 'terracotta',
  },
  ghost: { background: 'transparent', border: 'transparent', text: 'plum' },
};

export function Button({
  label,
  variant = 'primary',
  disabled = false,
  loading = false,
  icon,
  accessibilityLabel,
  ...rest
}: ButtonProps) {
  const reduceMotion = useReducedMotion();
  const scheme = palette[variant];
  const isInactive = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: isInactive, busy: loading }}
      disabled={isInactive}
      hitSlop={8}
      style={({ pressed }): ViewStyle => {
        const pressedActive = pressed && !isInactive;
        return {
          minHeight: minTouchTarget,
          minWidth: minTouchTarget,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: spacing.sm,
          paddingHorizontal: spacing.xl,
          paddingVertical: spacing.md,
          borderRadius: radii.button,
          borderWidth: variant === 'secondary' ? 2 : 0,
          borderColor: scheme.border,
          backgroundColor: scheme.background,
          opacity: isInactive ? 0.5 : pressedActive ? 0.85 : 1,
          // Subtle press feedback, suppressed under reduce-motion.
          transform:
            pressedActive && !reduceMotion ? [{ scale: 0.98 }] : undefined,
        };
      }}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={colors[scheme.text]} />
      ) : (
        <>
          {icon ? <View accessible={false}>{icon}</View> : null}
          <Typography
            variant="sectionTitle"
            color={scheme.text}
            style={{ textAlign: 'center' }}
          >
            {label}
          </Typography>
        </>
      )}
    </Pressable>
  );
}

export default Button;
