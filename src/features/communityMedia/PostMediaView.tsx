import { useEffect, useMemo, useState } from 'react';
import { Image, View } from 'react-native';

import { Caption } from '@/components';
import { communityMediaCopy as copy } from '@/content/communityMedia';
import { colors, radii, spacing } from '@/design/tokens';
import { getSupabaseClient, type AppSupabaseClient } from '@/lib/supabase';

import { signedMediaUrl, type PostMedia } from './mediaService';

export interface PostMediaViewProps {
  /** The post's media rows (as returned by `listPostMedia`). */
  media: readonly PostMedia[];
  /** The signed-in viewer's id; used to show private review notes to the author. */
  viewerId?: string | null;
  /** Overridable for tests; defaults to the shared public Supabase client. */
  client?: AppSupabaseClient;
}

type Resolved = Record<string, string | null>;

/** What the viewer is allowed to see for one item. */
type Visibility = 'image' | 'pendingOwn' | 'rejectedOwn' | 'hidden';

function visibilityFor(item: PostMedia, viewerId: string | null): Visibility {
  const isAuthor = viewerId !== null && item.author_id === viewerId;
  if (item.status === 'approved') return 'image';
  if (!isAuthor) return 'hidden';
  return item.status === 'pending' ? 'pendingOwn' : 'rejectedOwn';
}

const imageStyle = {
  width: '100%',
  aspectRatio: 1,
  borderRadius: radii.button,
  backgroundColor: colors.mutedSage,
} as const;

/**
 * Renders a community post's images (issue #39) through short-lived signed URLs
 * only — never public URLs. Visibility is enforced by the server (a signed URL is
 * only issued when the viewer may read the object) and mirrored here:
 * - approved media is shown when its URL resolves, and nothing otherwise;
 * - the author's own pending media shows a private "awaiting review" note with a
 *   preview only they can load; rejected media shows a private "not approved"
 *   note and no image;
 * - anyone else never sees pending or rejected media, and no URL is requested.
 * Alt text is neutral copy and never describes a body, shape, or weight.
 */
export function PostMediaView({ media, viewerId, client }: PostMediaViewProps) {
  const viewer = viewerId ?? null;
  const [resolved, setResolved] = useState<Resolved>({});

  const toResolve = useMemo(
    () =>
      media.filter((item) => {
        const v = visibilityFor(item, viewer);
        return v === 'image' || v === 'pendingOwn';
      }),
    [media, viewer],
  );

  useEffect(() => {
    if (toResolve.length === 0) return;
    let cancelled = false;
    const supabase = client ?? getSupabaseClient();
    void Promise.all(
      toResolve.map(async (item) => {
        const result = await signedMediaUrl(supabase, item.storage_path);
        return [item.id, result.ok ? result.url : null] as const;
      }),
    ).then((entries) => {
      if (cancelled) return;
      setResolved((prev) => {
        const next: Resolved = { ...prev };
        for (const [id, url] of entries) next[id] = url;
        return next;
      });
    });
    return () => {
      cancelled = true;
    };
  }, [toResolve, client]);

  const items = media
    .map((item) => ({ item, visibility: visibilityFor(item, viewer) }))
    .filter(({ visibility }) => visibility !== 'hidden');

  if (items.length === 0) return null;

  return (
    <View style={{ gap: spacing.sm }}>
      {items.map(({ item, visibility }) => {
        const url = resolved[item.id];

        if (visibility === 'rejectedOwn') {
          return (
            <Caption key={item.id} color="plum">
              {copy.rejectedNote}
            </Caption>
          );
        }

        if (visibility === 'pendingOwn') {
          return (
            <View key={item.id} style={{ gap: spacing.xs }}>
              {url ? (
                <Image
                  accessibilityRole="image"
                  accessibilityLabel={copy.imageAlt}
                  source={{ uri: url }}
                  resizeMode="cover"
                  style={[imageStyle, { opacity: 0.6 }]}
                />
              ) : null}
              <Caption color="plum">{copy.pendingNote}</Caption>
            </View>
          );
        }

        // Approved: render only once a signed URL resolves; nothing otherwise.
        if (url === undefined) {
          return (
            <View
              key={item.id}
              accessibilityLabel={copy.loadingLabel}
              accessibilityRole="progressbar"
              style={imageStyle}
            />
          );
        }
        if (url === null) return null;
        return (
          <Image
            key={item.id}
            accessibilityRole="image"
            accessibilityLabel={copy.imageAlt}
            source={{ uri: url }}
            resizeMode="cover"
            style={imageStyle}
          />
        );
      })}
    </View>
  );
}

export default PostMediaView;
