import { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { communityMediaCopy } from '@/content/communityMedia';
import { colors, spacing } from '@/design/tokens';
import { useAuthStore } from '@/features/auth';
import {
  CommunityFeedScreen,
  useCommunityStore,
  type CommunityPost,
} from '@/features/community';
import {
  invalidReasonMessage,
  listPostMedia,
  PostMediaPicker,
  PostMediaView,
  uploadPostMedia,
  type MediaAsset,
  type PostMedia,
} from '@/features/communityMedia';
import { getSupabaseClient } from '@/lib/supabase';

/**
 * Community route (issues #38, #39). Two separate spaces — postpartum recovery
 * and gentle weight care. Reading is free; posting and support are Pro
 * (enforced on the server). Posts and their images appear to others only after
 * a moderator approves them. This route composes the feed with community media
 * so the two features stay independent.
 */
export default function CommunityRoute() {
  const userId = useAuthStore((state) => state.session?.user.id);
  const posts = useCommunityStore((state) => state.posts);

  const [media, setMedia] = useState<MediaAsset | null>(null);
  const [uploading, setUploading] = useState(false);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [mediaByPost, setMediaByPost] = useState<Record<string, PostMedia[]>>(
    {},
  );

  // Load media for the posts currently in the feed (RLS decides what's visible).
  const postKey = posts.map((post) => post.id).join(',');
  useEffect(() => {
    const ids = postKey ? postKey.split(',') : [];
    let active = true;
    const pending: Promise<{ ok: true; media: PostMedia[] } | { ok: false }> =
      ids.length === 0
        ? Promise.resolve({ ok: true, media: [] })
        : listPostMedia(getSupabaseClient(), ids);
    void pending.then((result) => {
      if (!active || !result.ok) return;
      const grouped: Record<string, PostMedia[]> = {};
      for (const item of result.media) {
        (grouped[item.post_id] ??= []).push(item);
      }
      setMediaByPost(grouped);
    });
    return () => {
      active = false;
    };
  }, [postKey]);

  // After a post is created, attach its image (the post stays posted even if
  // the image upload fails; the member sees a gentle note).
  const onPostCreated = async (post: CommunityPost) => {
    if (!media || !userId) return;
    setUploading(true);
    setMediaError(null);
    const result = await uploadPostMedia(
      getSupabaseClient(),
      userId,
      post.id,
      media,
    );
    setUploading(false);
    if (result.ok) {
      setMedia(null);
      setMediaByPost((prev) => ({
        ...prev,
        [post.id]: [...(prev[post.id] ?? []), result.media],
      }));
    } else {
      setMediaError(
        result.kind === 'invalid'
          ? invalidReasonMessage(result.reason)
          : communityMediaCopy.uploadError,
      );
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.ivory }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View
          style={{
            flex: 1,
            gap: spacing.xl,
            padding: spacing.xl,
            maxWidth: 560,
            width: '100%',
            alignSelf: 'center',
          }}
        >
          <CommunityFeedScreen
            composerAttachment={
              <PostMediaPicker
                value={media}
                onChange={(asset) => {
                  setMedia(asset);
                  setMediaError(null);
                }}
                disabled={uploading}
                uploading={uploading}
                errorMessage={mediaError}
              />
            }
            onPostCreated={onPostCreated}
            renderMedia={(post) => (
              <PostMediaView
                media={mediaByPost[post.id] ?? []}
                viewerId={userId}
              />
            )}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
