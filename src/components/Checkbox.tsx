import { Pressable, View } from 'react-native';

import { colors, minTouchTarget, radii, spacing } from '@/design/tokens';

import { Body, Typography } from './Typography';

export interface CheckboxProps {
  /** Visible label; also the control's accessibility label. */
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  /** Inline validation message shown when the box must be checked. */
  error?: string;
}

/**
 * Accessible checkbox (issue #10). Exposes the `checkbox` role and checked
 * state to screen readers, and the whole row is a single 48dp touch target.
 */
export function Checkbox({ label, checked, onChange, error }: CheckboxProps) {
  return (
    <View style={{ gap: spacing.xs }}>
      <Pressable
        accessibilityRole="checkbox"
        accessibilityLabel={label}
        accessibilityState={{ checked }}
        hitSlop={8}
        onPress={() => onChange(!checked)}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.md,
          minHeight: minTouchTarget,
          paddingVertical: spacing.xs,
        }}
      >
        <View
          // Decorative: the Pressable already conveys role and state.
          accessibilityElementsHidden
          importantForAccessibility="no"
          style={{
            width: 24,
            height: 24,
            borderRadius: radii.button / 2,
            borderWidth: 2,
            borderColor: error ? colors.terracotta : colors.plum,
            backgroundColor: checked ? colors.plum : 'transparent',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {checked ? <Body color="ivory">{'✓'}</Body> : null}
        </View>
        <Body style={{ flex: 1 }}>{label}</Body>
      </Pressable>

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

export default Checkbox;
