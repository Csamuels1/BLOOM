import { useState } from 'react';
import { Pressable, TextInput, View, type TextInputProps } from 'react-native';

import {
  colors,
  maxFontSizeMultiplier,
  minTouchTarget,
  radii,
  spacing,
  typography,
} from '@/design/tokens';

import { Caption, Typography } from './Typography';

export interface TextFieldProps extends Omit<
  TextInputProps,
  'style' | 'placeholderTextColor'
> {
  /** Visible label; also the input's accessibility label. */
  label: string;
  /** Inline validation message. Presence marks the field invalid. */
  error?: string;
  /** Optional helper text shown under the label. */
  hint?: string;
}

/**
 * Accessible labeled text input (issue #10).
 *
 * The visible label is the accessibility label; errors are announced politely
 * and mark the field `aria-invalid`. Secure fields get an inline show/hide
 * toggle. Error text uses warm terracotta, never red (docs/BRAND_AND_COPY.md).
 */
export function TextField({
  label,
  error,
  hint,
  secureTextEntry,
  ...rest
}: TextFieldProps) {
  const [focused, setFocused] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const isSecure = Boolean(secureTextEntry);
  const hideText = isSecure && !revealed;

  const borderColor = error
    ? colors.terracotta
    : focused
      ? colors.plum
      : colors.mutedSage;

  return (
    <View style={{ gap: spacing.xs }}>
      <Caption color="plum">{label}</Caption>
      {hint ? <Caption color="plum">{hint}</Caption> : null}

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          borderWidth: 1.5,
          borderColor,
          borderRadius: radii.button,
          backgroundColor: colors.ivory,
          paddingHorizontal: spacing.md,
        }}
      >
        <TextInput
          accessibilityLabel={label}
          accessibilityHint={hint}
          aria-invalid={Boolean(error)}
          secureTextEntry={hideText}
          placeholderTextColor={colors.mutedSage}
          allowFontScaling
          maxFontSizeMultiplier={maxFontSizeMultiplier}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            flex: 1,
            minHeight: minTouchTarget,
            paddingVertical: spacing.sm,
            color: colors.plum,
            fontFamily: 'Manrope',
            fontSize: typography.body.fontSize,
          }}
          {...rest}
        />

        {isSecure ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={revealed ? 'Hide password' : 'Show password'}
            hitSlop={8}
            onPress={() => setRevealed((value) => !value)}
            style={{
              minHeight: minTouchTarget,
              justifyContent: 'center',
              paddingLeft: spacing.sm,
            }}
          >
            <Caption color="terracotta">{revealed ? 'Hide' : 'Show'}</Caption>
          </Pressable>
        ) : null}
      </View>

      {error ? (
        <Typography
          variant="caption"
          color="terracotta"
          accessibilityLiveRegion="polite"
          role="alert"
        >
          {error}
        </Typography>
      ) : null}
    </View>
  );
}

export default TextField;
