import { View } from 'react-native';

import { colors, radii, spacing } from '@/design/tokens';

import { Button } from './Button';
import { Body, SectionTitle } from './Typography';

export interface EmptyStateProps {
  title: string;
  body?: string;
  /** Optional call to action. */
  actionLabel?: string;
  onAction?: () => void;
}

/**
 * A gentle "nothing here yet" presentation for a section that has no content
 * for a calm, non-judgmental reason (setup not finished, no entries yet). Reads
 * as an invitation, never a failure. The title is a header for assistive tech.
 */
export function EmptyState({
  title,
  body,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <View
      style={{
        backgroundColor: colors.ivory,
        borderRadius: radii.card,
        borderWidth: 1,
        borderColor: colors.mutedSage,
        padding: spacing.lg,
        gap: spacing.sm,
      }}
    >
      <SectionTitle>{title}</SectionTitle>
      {body ? <Body>{body}</Body> : null}
      {actionLabel && onAction ? (
        <Button label={actionLabel} variant="secondary" onPress={onAction} />
      ) : null}
    </View>
  );
}

export default EmptyState;
