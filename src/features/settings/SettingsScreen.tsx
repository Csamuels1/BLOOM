import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Share, View } from 'react-native';

import {
  Body,
  Button,
  Caption,
  Card,
  Checkbox,
  EmptyState,
  ErrorState,
  PageTitle,
  SafetyNotice,
  SectionTitle,
  Skeleton,
} from '@/components';
import { settingsCopy as copy } from '@/content/settings';
import { spacing } from '@/design/tokens';
import { useAuthStore } from '@/features/auth';
import { useProfileStore } from '@/features/profile';
import { useSubscriptionStore, useTier } from '@/features/subscription';
import { getSupabaseClient, type AppSupabaseClient } from '@/lib/supabase';
import type { Json } from '@/types/database';

import { SettingsLink } from './SettingsLink';
import {
  fetchSettingsProfile,
  requestDeletion,
  requestExport,
  requestSignOut,
  saveTrackCycle,
} from './settingsService';

export interface SettingsScreenProps {
  /** Injectable for tests; defaults to the app's Supabase client at call time. */
  client?: AppSupabaseClient;
}

type ClientResolver = () => AppSupabaseClient;

/**
 * Settings hub (issue #52): account, notifications, privacy, legal, and help.
 *
 * Resilience rules applied throughout:
 * - every section that reads data has explicit loading / empty / error states;
 * - every action shows working, success, and a visible, retryable failure —
 *   nothing fails silently and no async call can throw unhandled;
 * - preferences display the value the SERVER returned after a save, not the
 *   value the client asked for.
 */
export function SettingsScreen({ client }: SettingsScreenProps) {
  const resolveClient: ClientResolver = () => client ?? getSupabaseClient();

  return (
    <View style={{ gap: spacing.xxl }}>
      <View style={{ gap: spacing.xs }}>
        <PageTitle accessibilityRole="header">{copy.title}</PageTitle>
        <Body>{copy.intro}</Body>
      </View>

      <AccountSection resolveClient={resolveClient} />

      <Section title={copy.notificationsTitle}>
        <Body>{copy.notificationsBody}</Body>
        <SettingsLink label={copy.notificationsLink} href="/notifications" />
      </Section>

      <PrivacySection resolveClient={resolveClient} />

      <Section title={copy.legalTitle}>
        <SettingsLink label={copy.privacyPolicyLink} href="/privacy-policy" />
        <SettingsLink label={copy.termsLink} href="/terms" />
      </Section>

      <Section title={copy.helpTitle}>
        <Body>{copy.helpBody}</Body>
        <SettingsLink label={copy.supportLink} href="/support" />
      </Section>

      <Button
        label={copy.backHome}
        variant="ghost"
        onPress={() => router.navigate('/')}
      />
    </View>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={{ gap: spacing.md }}>
      <SectionTitle accessibilityRole="header">{title}</SectionTitle>
      {children}
    </View>
  );
}

function ErrorText({ children }: { children: string }) {
  return (
    <Caption color="terracotta" accessibilityLiveRegion="polite" role="alert">
      {children}
    </Caption>
  );
}

// ---------------------------------------------------------------------------
// Account
// ---------------------------------------------------------------------------

function AccountSection({ resolveClient }: { resolveClient: ClientResolver }) {
  const email = useAuthStore((state) => state.session?.user.email);
  const userId = useAuthStore((state) => state.session?.user.id);
  const tier = useTier();
  const planStatus = useSubscriptionStore((state) => state.status);
  const loadPlan = useSubscriptionStore((state) => state.load);

  const [signingOut, setSigningOut] = useState(false);
  const [signOutFailed, setSignOutFailed] = useState(false);

  const onSignOut = async () => {
    setSigningOut(true);
    setSignOutFailed(false);
    const result = await requestSignOut(resolveClient());
    // On success the auth guard leaves this screen; only failure needs UI.
    setSigningOut(false);
    if (!result.ok) setSignOutFailed(true);
  };

  const retryPlan = () => {
    if (!userId) return;
    void loadPlan(resolveClient(), userId).catch(() => undefined);
  };

  // The tier falls back to Free when unverified; say so instead of guessing.
  const planChecking = planStatus === 'loading' && tier === 'free';
  const planFailed = planStatus === 'error' && tier === 'free';

  return (
    <Section title={copy.accountTitle}>
      <Card style={{ gap: spacing.sm }}>
        <View style={{ gap: spacing.xs }}>
          <Caption>{copy.emailLabel}</Caption>
          <Body selectable>{email ?? copy.emailUnavailable}</Body>
        </View>
        <View style={{ gap: spacing.xs }}>
          <Caption>{copy.planLabel}</Caption>
          {planChecking ? (
            <Body accessibilityRole="progressbar">{copy.planChecking}</Body>
          ) : (
            <Body>{tier === 'pro' ? copy.planPro : copy.planFree}</Body>
          )}
          {planFailed ? (
            <View style={{ gap: spacing.xs }}>
              <ErrorText>{copy.planError}</ErrorText>
              <Button
                label={copy.retry}
                variant="ghost"
                onPress={retryPlan}
                disabled={!userId}
              />
            </View>
          ) : null}
        </View>
      </Card>
      <SettingsLink label={copy.planLink} href="/paywall" />
      <SettingsLink label={copy.setupLink} href="/onboarding" />
      <Button
        label={copy.signOut}
        accessibilityLabel={signingOut ? copy.signingOut : copy.signOut}
        variant="secondary"
        onPress={() => void onSignOut()}
        loading={signingOut}
        disabled={signingOut}
      />
      {signOutFailed ? <ErrorText>{copy.signOutError}</ErrorText> : null}
    </Section>
  );
}

// ---------------------------------------------------------------------------
// Privacy
// ---------------------------------------------------------------------------

function PrivacySection({ resolveClient }: { resolveClient: ClientResolver }) {
  return (
    <Section title={copy.privacyTitle}>
      <Body>{copy.privacyBody}</Body>
      <CyclePreference resolveClient={resolveClient} />
      <SettingsLink label={copy.blockedLink} href="/blocked" />
      <SettingsLink label={copy.reportsLink} href="/my-reports" />
      <ExportControl resolveClient={resolveClient} />
      <DeleteControl resolveClient={resolveClient} />
    </Section>
  );
}

type LoadState = 'loading' | 'loaded' | 'error';

function CyclePreference({ resolveClient }: { resolveClient: ClientResolver }) {
  const userId = useAuthStore((state) => state.session?.user.id);
  const profile = useProfileStore((state) => state.profile);
  const setProfile = useProfileStore((state) => state.setProfile);

  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [loadAttempt, setLoadAttempt] = useState(0);
  // The value being saved (shown while in flight), then cleared so the toggle
  // reads the server's stored value from the profile store.
  const [pending, setPending] = useState<boolean | null>(null);
  const [saveState, setSaveState] = useState<'idle' | 'saved' | 'error'>(
    'idle',
  );
  const [lastAttempt, setLastAttempt] = useState<boolean | null>(null);

  // Always re-read from the server on open so the screen reflects server truth.
  useEffect(() => {
    let active = true;
    void fetchSettingsProfile(resolveClient()).then((result) => {
      if (!active) return;
      if (result.ok) {
        setProfile(result.value);
        setLoadState('loaded');
      } else {
        setLoadState('error');
      }
    });
    return () => {
      active = false;
    };
    // Reload only on mount and explicit retry.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadAttempt]);

  const save = async (next: boolean) => {
    if (!userId || pending !== null) return;
    setPending(next);
    setLastAttempt(next);
    setSaveState('idle');
    const result = await saveTrackCycle(resolveClient(), userId, next);
    if (result.ok) {
      setProfile(result.value);
      setSaveState('saved');
    } else {
      // Revert: the toggle falls back to the last server-confirmed value.
      setSaveState('error');
    }
    setPending(null);
  };

  let body: React.ReactNode;
  if (loadState === 'loading') {
    body = (
      <View style={{ gap: spacing.sm }}>
        <Caption accessibilityRole="progressbar">{copy.loadingLabel}</Caption>
        <Skeleton height={20} width="60%" />
        <Skeleton height={14} />
      </View>
    );
  } else if (loadState === 'error') {
    body = (
      <ErrorState
        message={copy.preferencesLoadError}
        retryLabel={copy.retry}
        onRetry={() => {
          setLoadState('loading');
          setLoadAttempt((n) => n + 1);
        }}
      />
    );
  } else if (!profile) {
    body = (
      <EmptyState
        title={copy.preferencesEmptyTitle}
        body={copy.preferencesEmptyBody}
        actionLabel={copy.preferencesEmptyAction}
        onAction={() => router.navigate('/onboarding')}
      />
    );
  } else {
    body = (
      <View style={{ gap: spacing.xs }}>
        <Checkbox
          label={copy.cycleLabel}
          checked={pending ?? profile.track_cycle}
          onChange={(next) => void save(next)}
        />
        <Caption>{copy.cycleBody}</Caption>
        {pending !== null ? (
          <Caption accessibilityLiveRegion="polite">{copy.cycleSaving}</Caption>
        ) : null}
        {pending === null && saveState === 'saved' ? (
          <Caption color="sage" accessibilityLiveRegion="polite">
            {copy.cycleSaved}
          </Caption>
        ) : null}
        {pending === null && saveState === 'error' ? (
          <View style={{ gap: spacing.xs }}>
            <ErrorText>{copy.cycleError}</ErrorText>
            {lastAttempt !== null ? (
              <Button
                label={copy.retry}
                variant="ghost"
                onPress={() => void save(lastAttempt)}
              />
            ) : null}
          </View>
        ) : null}
      </View>
    );
  }

  return (
    <Card tone="plain" style={{ gap: spacing.sm }}>
      <SectionTitle>{copy.cycleTitle}</SectionTitle>
      {body}
    </Card>
  );
}

function ExportControl({ resolveClient }: { resolveClient: ClientResolver }) {
  const [state, setState] = useState<'idle' | 'working' | 'ready' | 'error'>(
    'idle',
  );
  const [data, setData] = useState<Json | null>(null);
  const [shareFailed, setShareFailed] = useState(false);

  const onExport = async () => {
    setState('working');
    setShareFailed(false);
    const result = await requestExport(resolveClient());
    if (result.ok) {
      setData(result.value);
      setState('ready');
    } else {
      setState('error');
    }
  };

  const onShare = async () => {
    if (data === null) return;
    setShareFailed(false);
    try {
      // The person chooses where the copy goes (files, mail, etc.).
      await Share.share({
        title: copy.exportData,
        message: JSON.stringify(data, null, 2),
      });
    } catch {
      setShareFailed(true);
    }
  };

  return (
    <View style={{ gap: spacing.sm }}>
      <Button
        label={copy.exportData}
        variant="secondary"
        onPress={() => void onExport()}
        loading={state === 'working'}
        disabled={state === 'working'}
      />
      {state === 'ready' ? (
        <View style={{ gap: spacing.sm }}>
          <Caption color="sage" accessibilityLiveRegion="polite">
            {copy.exportReady}
          </Caption>
          <Button
            label={copy.exportShare}
            variant="ghost"
            onPress={() => void onShare()}
          />
          {shareFailed ? <ErrorText>{copy.exportShareError}</ErrorText> : null}
        </View>
      ) : null}
      {state === 'error' ? (
        <View style={{ gap: spacing.xs }}>
          <ErrorText>{copy.exportError}</ErrorText>
          <Button
            label={copy.retry}
            variant="ghost"
            onPress={() => void onExport()}
          />
        </View>
      ) : null}
    </View>
  );
}

function DeleteControl({ resolveClient }: { resolveClient: ClientResolver }) {
  const userId = useAuthStore((state) => state.session?.user.id);
  const clearProfile = useProfileStore((state) => state.clear);

  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [state, setState] = useState<'idle' | 'done' | 'error'>('idle');

  const onConfirm = async () => {
    if (!userId) {
      setState('error');
      return;
    }
    setDeleting(true);
    setState('idle');
    const result = await requestDeletion(resolveClient(), userId);
    setDeleting(false);
    if (result.ok) {
      // Signed out inside deletion; the auth guard returns to sign-in.
      clearProfile();
      setState('done');
    } else {
      setState('error');
    }
  };

  if (state === 'done') {
    return (
      <Caption accessibilityLiveRegion="polite">{copy.deleteDone}</Caption>
    );
  }

  if (!confirming) {
    return (
      <Button
        label={copy.deleteAccount}
        variant="ghost"
        onPress={() => setConfirming(true)}
      />
    );
  }

  return (
    <View style={{ gap: spacing.sm }}>
      <SafetyNotice
        title={copy.deleteConfirmTitle}
        message={copy.deleteConfirmBody}
      />
      {state === 'error' ? <ErrorText>{copy.deleteError}</ErrorText> : null}
      <Button
        label={copy.deleteConfirm}
        onPress={() => void onConfirm()}
        loading={deleting}
        disabled={deleting}
      />
      <Button
        label={copy.deleteCancel}
        variant="ghost"
        onPress={() => {
          setConfirming(false);
          setState('idle');
        }}
        disabled={deleting}
      />
    </View>
  );
}

export default SettingsScreen;
