import { Link } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Body, Button, Caption, PageTitle, SafetyNotice } from '@/components';
import { homeCopy as copy } from '@/content/home';
import { colors, minTouchTarget, radii, spacing } from '@/design/tokens';
import { useAuthStore } from '@/features/auth';
import { deleteAccount, exportAccount } from '@/features/profile';
import { getSupabaseClient } from '@/lib/supabase';

/**
 * Authenticated home (issues #9, #20). Hosts onboarding entry and the account
 * lifecycle actions — export and delete — which are authenticated and scoped to
 * the signed-in user by RLS.
 */
export default function HomeScreen() {
  const signOut = useAuthStore((state) => state.signOut);
  const userId = useAuthStore((state) => state.session?.user.id);

  const [exportState, setExportState] = useState<
    'idle' | 'working' | 'done' | 'error'
  >('idle');
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const onExport = async () => {
    setExportState('working');
    const data = await exportAccount(getSupabaseClient());
    setExportState(data ? 'done' : 'error');
  };

  const onConfirmDelete = async () => {
    if (!userId) return;
    setDeleting(true);
    setDeleteError(null);
    const result = await deleteAccount(getSupabaseClient(), userId);
    setDeleting(false);
    if (!result.ok) {
      setDeleteError(copy.deleteError);
      return;
    }
    // Sign-out happened inside deleteAccount; the auth guard returns to sign-in.
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.ivory }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            gap: spacing.xl,
            padding: spacing.xl,
            maxWidth: 560,
            width: '100%',
            alignSelf: 'center',
          }}
        >
          <PageTitle>{copy.title}</PageTitle>
          <Body>{copy.body}</Body>

          <Link href="/onboarding" asChild>
            <Pressable
              accessibilityRole="link"
              accessibilityLabel={copy.startOnboarding}
              style={({ pressed }) => ({
                minHeight: minTouchTarget,
                justifyContent: 'center',
                paddingHorizontal: spacing.xl,
                paddingVertical: spacing.md,
                borderRadius: radii.button,
                backgroundColor: colors.terracotta,
                opacity: pressed ? 0.85 : 1,
              })}
            >
              <Body color="ivory" style={{ textAlign: 'center' }}>
                {copy.startOnboarding}
              </Body>
            </Pressable>
          </Link>

          <View style={{ gap: spacing.sm }}>
            <Button
              label={copy.exportData}
              variant="secondary"
              onPress={onExport}
              loading={exportState === 'working'}
              disabled={exportState === 'working'}
            />
            {exportState === 'done' ? (
              <Caption accessibilityLiveRegion="polite">
                {copy.exportReady}
              </Caption>
            ) : null}
            {exportState === 'error' ? (
              <Caption color="terracotta" accessibilityLiveRegion="polite">
                {copy.exportError}
              </Caption>
            ) : null}
          </View>

          {confirmingDelete ? (
            <View style={{ gap: spacing.sm }}>
              <SafetyNotice
                title={copy.deleteConfirmTitle}
                message={copy.deleteConfirmBody}
              />
              {deleteError ? (
                <Caption color="terracotta" accessibilityLiveRegion="polite">
                  {deleteError}
                </Caption>
              ) : null}
              <Button
                label={copy.deleteConfirm}
                onPress={onConfirmDelete}
                loading={deleting}
                disabled={deleting}
              />
              <Button
                label={copy.deleteCancel}
                variant="ghost"
                onPress={() => setConfirmingDelete(false)}
              />
            </View>
          ) : (
            <Button
              label={copy.deleteAccount}
              variant="ghost"
              onPress={() => setConfirmingDelete(true)}
            />
          )}

          <Button
            label={copy.signOut}
            variant="secondary"
            onPress={() => {
              void signOut(getSupabaseClient());
            }}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
