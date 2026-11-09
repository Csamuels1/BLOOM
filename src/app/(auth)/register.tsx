import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { View } from 'react-native';

import { Body, Button, Checkbox } from '@/components';
import { authCopy as copy } from '@/content/auth';
import { spacing } from '@/design/tokens';
import {
  authRedirectTo,
  AuthScaffold,
  ControlledTextField,
  messageForReason,
  registerSchema,
  registerWithEmail,
  type RegisterValues,
} from '@/features/auth';
import { getSupabaseClient } from '@/lib/supabase';

export default function RegisterScreen() {
  const [formError, setFormError] = useState<string | null>(null);
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
      ageConfirmed: false,
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    // The schema requires ageConfirmed === true, so creation cannot proceed
    // without the 18+ attestation (docs/SECURITY_BASELINE.md).
    const result = await registerWithEmail(
      getSupabaseClient(),
      { email: values.email, password: values.password },
      authRedirectTo('sign-in'),
    );
    if (result.ok) {
      router.replace({ pathname: '/verify', params: { email: values.email } });
      return;
    }
    setFormError(messageForReason(result.reason));
  });

  return (
    <AuthScaffold
      heading={copy.registerHeading}
      intro={copy.registerIntro}
      footer={
        <Button
          label={copy.toSignIn}
          variant="ghost"
          onPress={() => router.replace('/sign-in')}
        />
      }
    >
      <View style={{ gap: spacing.lg }}>
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
        <ControlledTextField
          control={control}
          name="password"
          label={copy.passwordLabel}
          placeholder={copy.passwordPlaceholder}
          error={errors.password?.message}
          secureTextEntry
          autoCapitalize="none"
          autoComplete="new-password"
          textContentType="newPassword"
        />
        <ControlledTextField
          control={control}
          name="confirmPassword"
          label={copy.confirmPasswordLabel}
          placeholder={copy.confirmPasswordPlaceholder}
          error={errors.confirmPassword?.message}
          secureTextEntry
          autoCapitalize="none"
          autoComplete="new-password"
          textContentType="newPassword"
        />

        <Controller
          control={control}
          name="ageConfirmed"
          render={({ field }) => (
            <Checkbox
              label={copy.ageConfirmLabel}
              checked={field.value === true}
              onChange={field.onChange}
              error={errors.ageConfirmed?.message}
            />
          )}
        />
        <Body>{copy.ageConfirmHint}</Body>

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
          label={copy.registerAction}
          onPress={onSubmit}
          loading={isSubmitting}
          disabled={isSubmitting}
        />
      </View>
    </AuthScaffold>
  );
}
