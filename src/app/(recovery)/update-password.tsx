import { zodResolver } from '@hookform/resolvers/zod';
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
  updatePassword,
  updatePasswordSchema,
  useAuthStore,
  type UpdatePasswordValues,
} from '@/features/auth';
import { getSupabaseClient } from '@/lib/supabase';

/**
 * Set a new password after following a recovery link (issue #10). Reached only
 * while the store's `recovering` flag is set (PASSWORD_RECOVERY). On success the
 * flag is cleared, which routes the now-authenticated user into the app.
 */
export default function UpdatePasswordScreen() {
  const endRecovery = useAuthStore((state) => state.endRecovery);
  const [done, setDone] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<UpdatePasswordValues>({
    resolver: zodResolver(updatePasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    const result = await updatePassword(getSupabaseClient(), values.password);
    if (result.ok) {
      setDone(true);
      return;
    }
    setFormError(messageForReason(result.reason));
  });

  return (
    <AuthScaffold heading={copy.updateHeading} intro={copy.updateBody}>
      <View style={{ gap: spacing.lg }}>
        {done ? (
          <>
            <Body accessibilityLiveRegion="polite" role="alert">
              {copy.updateDone}
            </Body>
            <Button label={copy.signInAction} onPress={() => endRecovery()} />
          </>
        ) : (
          <>
            <ControlledTextField
              control={control}
              name="password"
              label={copy.newPasswordLabel}
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
              label={copy.updateAction}
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
