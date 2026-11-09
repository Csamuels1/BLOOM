import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { View } from 'react-native';

import { Body, Button } from '@/components';
import { authCopy as copy } from '@/content/auth';
import { spacing } from '@/design/tokens';
import {
  authRedirectTo,
  AuthScaffold,
  ControlledTextField,
  forgotPasswordSchema,
  messageForReason,
  requestPasswordReset,
  type ForgotPasswordValues,
} from '@/features/auth';
import { getSupabaseClient } from '@/lib/supabase';

export default function ForgotPasswordScreen() {
  const [sent, setSent] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    const result = await requestPasswordReset(
      getSupabaseClient(),
      values.email,
      authRedirectTo('update-password'),
    );
    // Unknown emails return ok too (no enumeration); only transient issues fail.
    if (result.ok) {
      setSent(true);
      return;
    }
    setFormError(messageForReason(result.reason));
  });

  return (
    <AuthScaffold
      heading={copy.forgotHeading}
      intro={copy.forgotBody}
      footer={
        <Button
          label={copy.forgotToSignIn}
          variant="ghost"
          onPress={() => router.replace('/sign-in')}
        />
      }
    >
      <View style={{ gap: spacing.lg }}>
        {sent ? (
          <Body accessibilityLiveRegion="polite" role="alert">
            {copy.forgotSent}
          </Body>
        ) : (
          <>
            <ControlledTextField
              control={control}
              name="email"
              label={copy.emailLabel}
              placeholder={copy.emailPlaceholder}
              error={errors.email?.message}
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              textContentType="emailAddress"
              inputMode="email"
            />

            {formError ? (
              <Body
                color="terracotta"
                accessibilityLiveRegion="polite"
                role="alert"
              >
                {formError}
              </Body>
            ) : null}

            <Button
              label={copy.forgotAction}
              onPress={onSubmit}
              loading={isSubmitting}
              disabled={isSubmitting}
            />
          </>
        )}
      </View>
    </AuthScaffold>
  );
}
