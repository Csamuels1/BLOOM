import { type ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Body, Display, PageTitle } from '@/components';
import { colors, spacing } from '@/design/tokens';

/**
 * Shared layout for the auth screens (issue #10): safe area, keyboard-aware
 * scroll, a centered single column, and the brand wordmark + screen heading.
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
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
          keyboardShouldPersistTaps="handled"
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
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export default AuthScaffold;
