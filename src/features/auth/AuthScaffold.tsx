import { type ReactNode } from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Body, Display, KeyboardSafeScrollView, PageTitle } from '@/components';
import { colors, spacing } from '@/design/tokens';

/**
 * Shared layout for the auth screens (issue #10): safe area, a keyboard-aware
 * scroll that keeps the primary action reachable on Android too (#146), a
 * centered single column, and the brand wordmark and screen heading.
 */
export function AuthScaffold({
  heading,
  intro,
  children,
  footer,
}: {
  heading: string;
  intro?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.ivory }}>
      <KeyboardSafeScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
      >
        <View
          style={{
            gap: spacing.lg,
            padding: spacing.xl,
            maxWidth: 480,
            width: '100%',
            alignSelf: 'center',
          }}
        >
          <Display>BLOOM</Display>
          <PageTitle>{heading}</PageTitle>
          {intro ? <Body>{intro}</Body> : null}
          {children}
          {footer ? <View style={{ gap: spacing.sm }}>{footer}</View> : null}
        </View>
      </KeyboardSafeScrollView>
    </SafeAreaView>
  );
}

export default AuthScaffold;
