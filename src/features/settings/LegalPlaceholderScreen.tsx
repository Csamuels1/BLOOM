import { router } from 'expo-router';
import { View } from 'react-native';

import { Body, Button, Caption, Card, PageTitle } from '@/components';
import { settingsCopy as copy } from '@/content/settings';
import { colors, radii, spacing } from '@/design/tokens';

export interface LegalPlaceholderScreenProps {
  kind: 'privacy' | 'terms';
}

/**
 * Clearly marked placeholder for a legal document (issue #52). Engineering does
 * not author legal text: the final privacy policy and terms are owner-provided
 * before launch, and this screen says so plainly rather than implying a binding
 * document exists.
 */
export function LegalPlaceholderScreen({ kind }: LegalPlaceholderScreenProps) {
  const title = kind === 'privacy' ? copy.privacyPolicyTitle : copy.termsTitle;
  return (
    <View style={{ gap: spacing.xl }}>
      <View style={{ gap: spacing.sm, alignItems: 'flex-start' }}>
        <PageTitle accessibilityRole="header">{title}</PageTitle>
        <View
          style={{
            borderRadius: radii.pill,
            borderWidth: 1,
            borderColor: colors.gold,
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.xs,
          }}
        >
          <Caption>{copy.legalPlaceholderLabel}</Caption>
        </View>
      </View>
      <Card style={{ gap: spacing.sm }}>
        <Body>{copy.legalPlaceholderBody}</Body>
        <Caption>{copy.legalPlaceholderNote}</Caption>
      </Card>
      <Button
        label={copy.backToSettings}
        variant="ghost"
        onPress={() => router.navigate('/settings')}
      />
    </View>
  );
}

export default LegalPlaceholderScreen;
