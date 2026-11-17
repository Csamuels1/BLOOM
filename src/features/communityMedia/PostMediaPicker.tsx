import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { Image, View } from 'react-native';

import { Button, Caption } from '@/components';
import { communityMediaCopy as copy } from '@/content/communityMedia';
import { colors, radii, spacing } from '@/design/tokens';

import {
  validateMediaAsset,
  validateMediaType,
  type MediaAsset,
  type MediaInvalidReason,
} from './validation';

export interface PostMediaPickerProps {
  /** The currently attached (validated) image, or null. */
  value: MediaAsset | null;
  /** Called with a validated asset, or null when the image is removed. */
  onChange: (asset: MediaAsset | null) => void;
  /** Disable while the composer is submitting. */
  disabled?: boolean;
  /** Shows the gentle "adding your image" state while the composer uploads. */
  uploading?: boolean;
  /** An upload error from the composer, shown gently beneath the picker. */
  errorMessage?: string | null;
}

/** Gentle copy for each validation reason. */
export function invalidReasonMessage(reason: MediaInvalidReason): string {
  switch (reason) {
    case 'type':
      return copy.invalidType;
    case 'empty':
      return copy.invalidEmpty;
    case 'tooLarge':
      return copy.invalidTooLarge;
    case 'extension':
      return copy.invalidExtension;
  }
}

type PickOutcome =
  | { kind: 'picked'; asset: MediaAsset }
  | { kind: 'cancelled' }
  | { kind: 'denied' };

async function pickImage(): Promise<PickOutcome> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) return { kind: 'denied' };
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    quality: 0.8,
  });
  if (result.canceled) return { kind: 'cancelled' };
  const asset = result.assets[0];
  if (!asset) return { kind: 'cancelled' };
  return {
    kind: 'picked',
    asset: {
      uri: asset.uri,
      fileName: asset.fileName,
      mimeType: asset.mimeType,
      fileSize: asset.fileSize,
    },
  };
}

/**
 * Optional image attach for the community composer (issue #39). Validates the
 * picked image on the device (JPEG/PNG/WebP, up to 5 MB) and explains, before
 * anything is shared, that images are reviewed before anyone else can see them.
 * The composer uploads the attached asset with `uploadPostMedia` once the post
 * exists; the server re-checks every rule.
 */
export function PostMediaPicker({
  value,
  onChange,
  disabled = false,
  uploading = false,
  errorMessage = null,
}: PostMediaPickerProps) {
  const [notice, setNotice] = useState<string | null>(null);

  const onPick = async () => {
    setNotice(null);
    const outcome = await pickImage();
    if (outcome.kind === 'denied') {
      setNotice(copy.permissionDenied);
      return;
    }
    if (outcome.kind === 'cancelled') return;
    const { asset } = outcome;
    // When the picker reports no size, the real bytes are checked at upload.
    const check =
      typeof asset.fileSize === 'number'
        ? validateMediaAsset(asset)
        : validateMediaType(asset);
    if (!check.ok) {
      setNotice(invalidReasonMessage(check.reason));
      return;
    }
    onChange(asset);
  };

  const message = notice ?? errorMessage;

  return (
    <View style={{ gap: spacing.sm }}>
      {value ? (
        <View style={{ gap: spacing.sm }}>
          <Image
            accessibilityRole="image"
            accessibilityLabel={copy.attachedAlt}
            source={{ uri: value.uri }}
            resizeMode="cover"
            style={{
              width: '100%',
              aspectRatio: 1,
              borderRadius: radii.button,
              backgroundColor: colors.mutedSage,
            }}
          />
          <Caption color="sage">{copy.attachedLabel}</Caption>
          <Button
            label={copy.removeAttachedLabel}
            variant="ghost"
            accessibilityHint={copy.removeAttachedHint}
            disabled={disabled || uploading}
            onPress={() => {
              setNotice(null);
              onChange(null);
            }}
          />
        </View>
      ) : (
        <View style={{ gap: spacing.xs }}>
          <Button
            label={copy.attachLabel}
            variant="secondary"
            accessibilityHint={copy.attachHint}
            disabled={disabled || uploading}
            onPress={() => void onPick()}
          />
          <Caption color="plum">{copy.attachOptional}</Caption>
        </View>
      )}

      <Caption color="sage">{copy.reviewNote}</Caption>

      {uploading ? (
        <Caption accessibilityLiveRegion="polite" role="status" color="plum">
          {copy.uploading}
        </Caption>
      ) : null}

      {message ? (
        <Caption accessibilityLiveRegion="polite" role="alert" color="plum">
          {message}
        </Caption>
      ) : null}
    </View>
  );
}

export default PostMediaPicker;
