import * as ImagePicker from 'expo-image-picker';
import { useCallback, useEffect, useState } from 'react';
import { Image, View } from 'react-native';

import {
  Body,
  Button,
  Caption,
  EmptyState,
  ErrorState,
  SectionTitle,
} from '@/components';
import { photosCopy as copy } from '@/content/photos';
import { colors, radii, spacing } from '@/design/tokens';
import { useAuthStore } from '@/features/auth';
import { getSupabaseClient, type AppSupabaseClient } from '@/lib/supabase';

import type { PhotoAsset } from './photoService';
import { usePhotoStore } from './photoStore';

export interface ProgressPhotosScreenProps {
  /** Overridable for tests; defaults to the shared public Supabase client. */
  client?: AppSupabaseClient;
  /** Overridable for tests; defaults to the signed-in user's id. */
  userId?: string;
}

/** Launch the photo library and map the picked asset to our minimal shape. */
async function pickPhoto(): Promise<PhotoAsset | null> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    return null;
  }
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    quality: 0.8,
  });
  if (result.canceled) {
    return null;
  }
  const asset = result.assets[0];
  if (!asset) {
    return null;
  }
  return { uri: asset.uri, fileName: asset.fileName, mimeType: asset.mimeType };
}

/**
 * Private photos (issue #27). A calm, personal space where the user may — but
 * never must — keep photos for themselves. Every object is read, written, and
 * removed under the caller's own `"{userId}/"` prefix, and displayed only via
 * short-lived signed URLs, so a photo is private to its owner on both the client
 * and the server (Storage RLS). There is deliberately no before/after or
 * comparison framing: these are personal keepsakes, nothing more.
 *
 * Selection is optional: with nothing saved, the screen shows a warm, pressure-
 * free invitation rather than any prompt to add. All actions give gentle,
 * screen-reader-announced feedback, and deletion asks for a soft confirm first.
 */
export function ProgressPhotosScreen({
  client,
  userId,
}: ProgressPhotosScreenProps) {
  const sessionUserId = useAuthStore((state) => state.session?.user.id);
  const resolvedUserId = userId ?? sessionUserId;

  const items = usePhotoStore((state) => state.items);
  const status = usePhotoStore((state) => state.status);
  const pending = usePhotoStore((state) => state.pending);
  const error = usePhotoStore((state) => state.error);
  const load = usePhotoStore((state) => state.load);
  const add = usePhotoStore((state) => state.add);
  const replace = usePhotoStore((state) => state.replace);
  const remove = usePhotoStore((state) => state.remove);
  const clearError = usePhotoStore((state) => state.clearError);

  const [confirmingName, setConfirmingName] = useState<string | null>(null);

  const getClient = useCallback(
    (): AppSupabaseClient => client ?? getSupabaseClient(),
    [client],
  );

  useEffect(() => {
    if (resolvedUserId && status === 'idle') {
      void load(getClient(), resolvedUserId);
    }
  }, [resolvedUserId, status, load, getClient]);

  const onAdd = async () => {
    if (!resolvedUserId) return;
    const asset = await pickPhoto();
    if (!asset) return;
    await add(getClient(), resolvedUserId, asset);
  };

  const onReplace = async (oldName: string) => {
    if (!resolvedUserId) return;
    const asset = await pickPhoto();
    if (!asset) return;
    await replace(getClient(), resolvedUserId, oldName, asset);
  };

  const onRemove = async (name: string) => {
    if (!resolvedUserId) return;
    setConfirmingName(null);
    await remove(getClient(), resolvedUserId, name);
  };

  const isLoading = status === 'idle' || status === 'loading';
  const isError = status === 'error';
  const isEmpty = status === 'loaded' && items.length === 0;

  const pendingLabel =
    pending === 'adding'
      ? copy.adding
      : pending === 'replacing'
        ? copy.replacing
        : pending === 'removing'
          ? copy.deleting
          : null;

  return (
    <View style={{ gap: spacing.xl }}>
      <View style={{ gap: spacing.xs }}>
        <SectionTitle accessibilityRole="header">{copy.title}</SectionTitle>
        <Body>{copy.intro}</Body>
        <Caption color="sage">{copy.privacyNote}</Caption>
      </View>

      {/* Adding is always available and always optional. */}
      <View style={{ gap: spacing.sm }}>
        <Button
          label={copy.addLabel}
          onPress={onAdd}
          accessibilityHint={copy.addHint}
          loading={pending === 'adding'}
          disabled={pending !== null || !resolvedUserId}
        />
        {pendingLabel ? (
          <Caption accessibilityLiveRegion="polite" role="status" color="plum">
            {pendingLabel}
          </Caption>
        ) : null}
      </View>

      {/* A gentle, dismissible error for a failed action — never alarming. */}
      {error ? (
        <ErrorState
          message={error}
          retryLabel={copy.dismiss}
          onRetry={clearError}
        />
      ) : null}

      {/* A failed load is calm and retryable. */}
      {isError ? (
        <ErrorState
          message={copy.loadError}
          retryLabel={copy.retry}
          onRetry={() =>
            resolvedUserId ? void load(getClient(), resolvedUserId) : undefined
          }
        />
      ) : null}

      {/* Optional: with nothing saved, invite warmly — never pressure. */}
      {isEmpty ? (
        <EmptyState
          title={copy.emptyTitle}
          body={copy.emptyBody}
          actionLabel={copy.emptyAction}
          onAction={onAdd}
        />
      ) : null}

      <View
        style={{ gap: spacing.md }}
        accessibilityLabel={isLoading ? copy.loadingLabel : copy.listLabel}
        accessibilityRole={isLoading ? 'progressbar' : undefined}
      >
        {isLoading
          ? null
          : items.map((item) => (
              <View
                key={item.name}
                style={{
                  backgroundColor: colors.ivory,
                  borderRadius: radii.card,
                  borderWidth: 1,
                  borderColor: colors.mutedSage,
                  padding: spacing.md,
                  gap: spacing.sm,
                }}
              >
                {item.url ? (
                  <Image
                    accessibilityRole="image"
                    accessibilityLabel={copy.photoAlt}
                    source={{ uri: item.url }}
                    resizeMode="cover"
                    style={{
                      width: '100%',
                      aspectRatio: 1,
                      borderRadius: radii.button,
                      backgroundColor: colors.mutedSage,
                    }}
                  />
                ) : (
                  <View
                    accessibilityLabel={copy.loadError}
                    style={{
                      width: '100%',
                      aspectRatio: 1,
                      borderRadius: radii.button,
                      backgroundColor: colors.mutedSage,
                    }}
                  />
                )}

                {confirmingName === item.name ? (
                  <View style={{ gap: spacing.sm }}>
                    <SectionTitle>{copy.deleteConfirmTitle}</SectionTitle>
                    <Body>{copy.deleteConfirmBody}</Body>
                    <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                      <View style={{ flexGrow: 1, flexBasis: 120 }}>
                        <Button
                          label={copy.deleteConfirm}
                          variant="secondary"
                          onPress={() => void onRemove(item.name)}
                        />
                      </View>
                      <View style={{ flexGrow: 1, flexBasis: 120 }}>
                        <Button
                          label={copy.deleteCancel}
                          variant="ghost"
                          onPress={() => setConfirmingName(null)}
                        />
                      </View>
                    </View>
                  </View>
                ) : (
                  <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                    <View style={{ flexGrow: 1, flexBasis: 120 }}>
                      <Button
                        label={copy.replaceLabel}
                        variant="secondary"
                        accessibilityHint={copy.replaceHint}
                        disabled={pending !== null}
                        onPress={() => void onReplace(item.name)}
                      />
                    </View>
                    <View style={{ flexGrow: 1, flexBasis: 120 }}>
                      <Button
                        label={copy.deleteLabel}
                        variant="ghost"
                        accessibilityHint={copy.deleteHint}
                        disabled={pending !== null}
                        onPress={() => setConfirmingName(item.name)}
                      />
                    </View>
                  </View>
                )}
              </View>
            ))}
      </View>
    </View>
  );
}

export default ProgressPhotosScreen;
