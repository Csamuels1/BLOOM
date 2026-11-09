import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { View } from 'react-native';

import { Body, Button } from '@/components';
import { authCopy as copy } from '@/content/auth';
import { spacing } from '@/design/tokens';
import {
  AuthScaffold,
  ControlledTextField,
  messageForReason,
  signInSchema,
  signInWithEmail,
  type SignInValues,
} from '@/features/auth';
import { getSupabaseClient } from '@/lib/supabase';

export default function SignInScreen() {
  const [formError, setFormError] = useState<string | null>(null);
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    const result = await signInWithEmail(getSupabaseClient(), values);
    if (result.ok) {
      // A successful sign-in flips the session; the root guard routes to the app.
      return;
    }
    if (result.reason === 'unverified') {
      router.push('/verify');
      return;
    }
    setFormError(messageForReason(result.reason));
  });

  return (
    <AuthScaffold
      heading={copy.signInHeading}
      intro={copy.signInIntro}
      footer={
        <>
          <Button
            label={copy.toRegister}
            variant="secondary"
            onPress={() => router.push('/register')}
          />
          <Button
            label={copy.toForgotPassword}
            variant="ghost"
            onPress={() => router.push('/forgot-password')}
          />
        </>
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
          autoComplete="current-password"
          textContentType="password"
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
          label={copy.signInAction}
          onPress={onSubmit}
          loading={isSubmitting}
          disabled={isSubmitting}
        />
      </View>
    </AuthScaffold>
  );
}
