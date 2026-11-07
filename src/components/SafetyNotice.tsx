import { View, type ViewProps, type ViewStyle } from 'react-native';

import { colors, radii, spacing } from '@/design/tokens';

import { Body, SectionTitle } from './Typography';

export interface SafetyNoticeProps extends ViewProps {
  /** Short, calm heading. Voice-reviewed copy (never alarmist). */
  title: string;
  /** Supporting, non-diagnostic message. */
  message: string;
  /** Optional leading element (e.g. an icon). */
  icon?: React.ReactNode;
}

/**
 * Caution surface reserved for GENUINE safety notices only (docs/BRAND_AND_COPY.md).
 * Amber is never used for calories, weight, missed logs, or ordinary errors.
 * Announced to screen readers as an alert.
 */
export function SafetyNotice({
  title,
  message,
  icon,
  style,
  ...rest
}: SafetyNoticeProps) {
  const base: ViewStyle = {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radii.card,
    borderLeftWidth: 4,
    borderLeftColor: colors.amber,
    backgroundColor: colors.ivory,
  };

  return (
    <View
      accessibilityRole="alert"
      accessible
      accessibilityLabel={`${title}. ${message}`}
      style={[base, style]}
      {...rest}
    >
      {icon ? <View accessible={false}>{icon}</View> : null}
      <View style={{ flex: 1, gap: spacing.xs }}>
        <SectionTitle color="amber">{title}</SectionTitle>
        <Body>{message}</Body>
      </View>
    </View>
  );
}

export default SafetyNotice;
