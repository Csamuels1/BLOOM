import { View } from 'react-native';

import { colors, radii, spacing } from '@/design/tokens';

import { Button } from './Button';
import { Body, SectionTitle } from './Typography';

export interface ErrorStateProps {
  title?: string;
  message: string;
  /** Retry affordance so an interrupted load is never a dead end. */
  retryLabel?: string;
  onRetry?: () => void;
}

/**
 * A gentle error presentation. It stays calm — plum and terracotta, never the
 * amber reserved for genuine safety notices (docs/BRAND_AND_COPY.md) — states
 * plainly what happened, and offers a retry so no initiated action is silently
 * lost. The message is announced politely to assistive tech.
 */
export function ErrorState({
  title,
  message,
  retryLabel,
  onRetry,
}: ErrorStateProps) {
  return (
    <View
      accessibilityLiveRegion="polite"
      style={{
        backgroundColor: colors.ivory,
        borderRadius: radii.card,
        borderWidth: 1,
        borderColor: colors.blush,
        padding: spacing.lg,
        gap: spacing.sm,
      }}
    >
      {title ? <SectionTitle>{title}</SectionTitle> : null}
      <Body>{message}</Body>
      {retryLabel && onRetry ? (
        <Button label={retryLabel} variant="secondary" onPress={onRetry} />
      ) : null}
    </View>
  );
}

export default ErrorState;
