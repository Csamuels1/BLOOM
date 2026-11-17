import { useState, type ReactNode } from 'react';
import { View } from 'react-native';

import { Body, Button, Caption, Card, Pill } from '@/components';
import { communityCopy as copy } from '@/content/community';
import { colors, radii, spacing } from '@/design/tokens';

import { type CommunityPost } from './communityService';

export interface PostCardProps {
  post: CommunityPost;
  /** The signed-in viewer's id; decides ownership (delete, review notice). */
  viewerId: string | null;
  /** Whether the viewer can send support (Pro). The server enforces regardless. */
  canSupport: boolean;
  /** Whether the viewer has supported this post (yes/no — never a count). */
  supported: boolean;
  /** For the viewer's own post: whether someone is with them (yes/no). */
  receivedSupport?: boolean;
  onToggleSupport?: (post: CommunityPost) => void;
  /** Resolves true when the post was deleted. */
  onDelete?: (post: CommunityPost) => Promise<boolean> | void;
  /** Slot for post media (e.g. approved images) — rendered under the body. */
  renderMedia?: (post: CommunityPost) => ReactNode;
  /** Slot for extra actions (e.g. report / block) — rendered in the footer. */
  renderActions?: (post: CommunityPost) => ReactNode;
}

/** A readable posted-on date, locale-aware. */
function formatPostedAt(iso: string): string {
  try {
    return new Intl.DateTimeFormat(undefined, {
      day: 'numeric',
      month: 'long',
    }).format(new Date(iso));
  } catch {
    return iso.slice(0, 10);
  }
}

/**
 * One community post (issue #38). Shows the viewer's own pending post as
 * "awaiting review"; lets authors delete with a gentle confirm; and gives Pro
 * viewers a quiet support toggle on others' approved posts. There are no
 * counts anywhere — support is a private yes/no, and authors only ever see
 * that "someone is with you".
 */
export function PostCard({
  post,
  viewerId,
  canSupport,
  supported,
  receivedSupport = false,
  onToggleSupport,
  onDelete,
  renderMedia,
  renderActions,
}: PostCardProps) {
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const isOwn = viewerId !== null && post.author_id === viewerId;
  const isPending = post.status === 'pending';
  const isApproved = post.status === 'approved';
  const showSupport = !isOwn && isApproved && canSupport && onToggleSupport;

  async function confirmDelete() {
    if (!onDelete) return;
    setDeleting(true);
    const result = await onDelete(post);
    setDeleting(false);
    if (result !== false) {
      setConfirmingDelete(false);
    }
  }

  return (
    <Card>
      <View style={{ gap: spacing.sm }}>
        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: spacing.sm,
            alignItems: 'center',
          }}
        >
          {isOwn ? <Caption color="terracotta">{copy.yourPost}</Caption> : null}
          <Caption color="plum">{formatPostedAt(post.created_at)}</Caption>
        </View>

        {isOwn && isPending ? (
          <View
            accessibilityRole="text"
            accessibilityLabel={`${copy.awaitingReview}. ${copy.awaitingReviewBody}`}
            style={{
              gap: spacing.xs,
              backgroundColor: colors.ivory,
              borderRadius: radii.card,
              borderWidth: 1,
              borderColor: colors.gold,
              padding: spacing.md,
            }}
          >
            <Caption color="plum">{copy.awaitingReview}</Caption>
            <Caption color="plum">{copy.awaitingReviewBody}</Caption>
          </View>
        ) : null}

        <Body>{post.body}</Body>

        {renderMedia ? renderMedia(post) : null}

        {isOwn && isApproved && receivedSupport ? (
          <Caption color="sage">{copy.supportReceived}</Caption>
        ) : null}

        {showSupport ? (
          <Pill
            label={supported ? copy.supportActive : copy.supportAction}
            selected={supported}
            accessibilityHint={copy.supportHint}
            onPress={() => onToggleSupport(post)}
          />
        ) : null}

        {isOwn && onDelete ? (
          confirmingDelete ? (
            <View
              accessibilityLiveRegion="polite"
              style={{
                gap: spacing.sm,
                backgroundColor: colors.ivory,
                borderRadius: radii.card,
                borderWidth: 1,
                borderColor: colors.blush,
                padding: spacing.md,
              }}
            >
              <Body>{copy.deleteConfirmBody}</Body>
              <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                <View style={{ flexGrow: 1 }}>
                  <Button
                    label={copy.deleteConfirm}
                    variant="secondary"
                    loading={deleting}
                    onPress={() => void confirmDelete()}
                  />
                </View>
                <View style={{ flexGrow: 1 }}>
                  <Button
                    label={copy.deleteCancel}
                    variant="ghost"
                    onPress={() => setConfirmingDelete(false)}
                  />
                </View>
              </View>
            </View>
          ) : (
            <View style={{ alignSelf: 'flex-start' }}>
              <Button
                label={copy.deleteAction}
                variant="ghost"
                onPress={() => setConfirmingDelete(true)}
              />
            </View>
          )
        ) : null}

        {renderActions ? renderActions(post) : null}
      </View>
    </Card>
  );
}

export default PostCard;
