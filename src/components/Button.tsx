import {
  ActivityIndicator,
  Pressable,
  View,
  type PressableProps,
  type ViewStyle,
} from 'react-native';

import { motion } from '@/design/motion';
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
      style={{ minHeight: minTouchTarget, minWidth: minTouchTarget }}
      {...rest}
    >
      {({ pressed }) => {
        const pressedActive = pressed && !isInactive;
        // The visual lives on a plain View, not in Pressable's style function.
        // On Android (Expo Go, SDK 57) the style function's result was not
        // applied: the plum fill vanished and "Sign in" rendered ivory on
        // ivory, invisible (#146).
        const face: ViewStyle = {
          minHeight: minTouchTarget,
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
          // Subtle press feedback, suppressed under reduce-motion. Always an
          // array: never hand the native view `transform: undefined`.
          transform: [
            { scale: pressedActive && !reduceMotion ? motion.pressScale : 1 },
          ],
        };
        return (
          <View style={face}>
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
          </View>
        );
      }}
    </Pressable>
  );
}

export default Button;
