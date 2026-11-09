import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { Body, Button } from '@/components';
import { authCopy as copy } from '@/content/auth';
import { spacing } from '@/design/tokens';
import {
  authRedirectTo,
  AuthScaffold,
  messageForReason,
  resendVerification,
} from '@/features/auth';
import { getSupabaseClient } from '@/lib/supabase';

export default function VerifyScreen() {
  const { email } = useLocalSearchParams<{ email?: string }>();
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const onResend = async () => {
    if (!email) return;
    setBusy(true);
    setNotice(null);
    const result = await resendVerification(
      getSupabaseClient(),
      email,
      authRedirectTo('sign-in'),
    );
    setBusy(false);
    // Neutral either way: a transient failure asks to retry; otherwise confirm.
    setNotice(result.ok ? copy.verifyResent : messageForReason(result.reason));
  };

  return (
    <AuthScaffold
      heading={copy.verifyHeading}
      footer={
        <Button
          label={copy.verifyToSignIn}
          variant="ghost"
          onPress={() => router.replace('/sign-in')}
        />
      }
    >
      <View style={{ gap: spacing.lg }}>
        <Body>{copy.verifyBody}</Body>

        {notice ? (
          <Body
            color="terracotta"
            accessibilityLiveRegion="polite"
            role="alert"
          >
            {notice}
          </Body>
        ) : null}

        {email ? (
          <Button
            label={copy.verifyResend}
            variant="secondary"
            onPress={onResend}
            loading={busy}
            disabled={busy}
          />
        ) : null}
      </View>
    </AuthScaffold>
  );
}
