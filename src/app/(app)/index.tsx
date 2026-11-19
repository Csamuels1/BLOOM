import { Link } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  Body,
  Button,
  Caption,
  SafetyNotice,
  SectionTitle,
} from '@/components';
import { communityCopy } from '@/content/community';
import { cycleCopy } from '@/content/cycle';
import { homeCopy as copy } from '@/content/home';
import { moderationCopy } from '@/content/moderation';
import { notificationsCopy } from '@/content/notifications';
import { reportingCopy } from '@/content/reporting';
import { todayCopy } from '@/content/today';
import { colors, minTouchTarget, radii, spacing } from '@/design/tokens';
import { useAuthStore } from '@/features/auth';
import {
  deleteAccount,
  exportAccount,
  useProfileStore,
} from '@/features/profile';
import { supportCopy } from '@/content/support';
import { GentleCheckIn } from '@/features/support';
import { TodayScreen } from '@/features/today';
import { getSupabaseClient } from '@/lib/supabase';

/**
 * Authenticated home (issues #9, #20, #22). The Today screen is the branded
 * daily overview and leads the page; account lifecycle actions (export, delete,
 * sign out) — authenticated and RLS-scoped to the signed-in user — sit below in
 * a de-emphasized account section.
 */
export default function HomeScreen() {
  const signOut = useAuthStore((state) => state.signOut);
  const userId = useAuthStore((state) => state.session?.user.id);
  // Cosmetic gate only: show the staff link to moderators. The moderation route
  // and every action behind it are enforced server-side regardless of this.
  const role = useAuthStore((state) => state.session?.user.app_metadata?.role);
  const isModerator = role === 'moderator' || role === 'admin';

  const loadProfile = useProfileStore((state) => state.load);
  const profileStatus = useProfileStore((state) => state.status);

  // Load the profile once so the Today overview can tailor meals to the region.
  useEffect(() => {
    if (userId && profileStatus === 'idle') {
      void loadProfile(getSupabaseClient());
    }
  }, [userId, profileStatus, loadProfile]);

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
            gap: spacing.xxl,
            padding: spacing.xl,
            maxWidth: 560,
            width: '100%',
            alignSelf: 'center',
          }}
        >
          {/* A gentle, non-diagnostic check-in surfaces here only when the
              server-side engine (#48) flags a concerning pattern. */}
          <GentleCheckIn />

          <TodayScreen
            onRetryProfile={() => void loadProfile(getSupabaseClient())}
          />

          {/* De-emphasized account area — the daily overview comes first. */}
          <View style={{ gap: spacing.md }}>
            <SectionTitle>{todayCopy.accountTitle}</SectionTitle>

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
                  borderWidth: 1,
                  borderColor: colors.mutedSage,
                  opacity: pressed ? 0.85 : 1,
                })}
              >
                <Body style={{ textAlign: 'center' }}>
                  {copy.startOnboarding}
                </Body>
              </Pressable>
            </Link>

            <Link href="/community" asChild>
              <Pressable
                accessibilityRole="link"
                accessibilityLabel={communityCopy.title}
                style={({ pressed }) => ({
                  minHeight: minTouchTarget,
                  justifyContent: 'center',
                  paddingHorizontal: spacing.xl,
                  paddingVertical: spacing.md,
                  borderRadius: radii.button,
                  borderWidth: 1,
                  borderColor: colors.mutedSage,
                  opacity: pressed ? 0.85 : 1,
                })}
              >
                <Body style={{ textAlign: 'center' }}>
                  {communityCopy.title}
                </Body>
              </Pressable>
            </Link>

            <Link href="/cycle" asChild>
              <Pressable
                accessibilityRole="link"
                accessibilityLabel={cycleCopy.title}
                style={({ pressed }) => ({
                  minHeight: minTouchTarget,
                  justifyContent: 'center',
                  paddingHorizontal: spacing.xl,
                  paddingVertical: spacing.md,
                  borderRadius: radii.button,
                  borderWidth: 1,
                  borderColor: colors.mutedSage,
                  opacity: pressed ? 0.85 : 1,
                })}
              >
                <Body style={{ textAlign: 'center' }}>{cycleCopy.title}</Body>
              </Pressable>
            </Link>

            <Link href="/blocked" asChild>
              <Pressable
                accessibilityRole="link"
                accessibilityLabel={reportingCopy.blockedTitle}
                style={({ pressed }) => ({
                  minHeight: minTouchTarget,
                  justifyContent: 'center',
                  paddingHorizontal: spacing.xl,
                  paddingVertical: spacing.md,
                  borderRadius: radii.button,
                  borderWidth: 1,
                  borderColor: colors.mutedSage,
                  opacity: pressed ? 0.85 : 1,
                })}
              >
                <Body style={{ textAlign: 'center' }}>
                  {reportingCopy.blockedTitle}
                </Body>
              </Pressable>
            </Link>

            <Link href="/my-reports" asChild>
              <Pressable
                accessibilityRole="link"
                accessibilityLabel={reportingCopy.myReportsTitle}
                style={({ pressed }) => ({
                  minHeight: minTouchTarget,
                  justifyContent: 'center',
                  paddingHorizontal: spacing.xl,
                  paddingVertical: spacing.md,
                  borderRadius: radii.button,
                  borderWidth: 1,
                  borderColor: colors.mutedSage,
                  opacity: pressed ? 0.85 : 1,
                })}
              >
                <Body style={{ textAlign: 'center' }}>
                  {reportingCopy.myReportsTitle}
                </Body>
              </Pressable>
            </Link>

            <Link href="/notifications" asChild>
              <Pressable
                accessibilityRole="link"
                accessibilityLabel={notificationsCopy.title}
                style={({ pressed }) => ({
                  minHeight: minTouchTarget,
                  justifyContent: 'center',
                  paddingHorizontal: spacing.xl,
                  paddingVertical: spacing.md,
                  borderRadius: radii.button,
                  borderWidth: 1,
                  borderColor: colors.mutedSage,
                  opacity: pressed ? 0.85 : 1,
                })}
              >
                <Body style={{ textAlign: 'center' }}>
                  {notificationsCopy.title}
                </Body>
              </Pressable>
            </Link>

            <Link href="/support" asChild>
              <Pressable
                accessibilityRole="link"
                accessibilityLabel={supportCopy.title}
                style={({ pressed }) => ({
                  minHeight: minTouchTarget,
                  justifyContent: 'center',
                  paddingHorizontal: spacing.xl,
                  paddingVertical: spacing.md,
                  borderRadius: radii.button,
                  borderWidth: 1,
                  borderColor: colors.mutedSage,
                  opacity: pressed ? 0.85 : 1,
                })}
              >
                <Body style={{ textAlign: 'center' }}>{supportCopy.title}</Body>
              </Pressable>
            </Link>

            {isModerator ? (
              <Link href="/moderation" asChild>
                <Pressable
                  accessibilityRole="link"
                  accessibilityLabel={moderationCopy.title}
                  style={({ pressed }) => ({
                    minHeight: minTouchTarget,
                    justifyContent: 'center',
                    paddingHorizontal: spacing.xl,
                    paddingVertical: spacing.md,
                    borderRadius: radii.button,
                    borderWidth: 1,
                    borderColor: colors.mutedSage,
                    opacity: pressed ? 0.85 : 1,
                  })}
                >
                  <Body style={{ textAlign: 'center' }}>
                    {moderationCopy.title}
                  </Body>
                </Pressable>
              </Link>
            ) : null}

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
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
