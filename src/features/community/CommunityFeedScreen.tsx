import { useEffect, type ReactNode } from 'react';
import { View } from 'react-native';

import {
  Body,
  Card,
  EmptyState,
  ErrorState,
  PageTitle,
  SectionTitle,
  Skeleton,
} from '@/components';
import { communityCopy as copy } from '@/content/community';
import { spacing } from '@/design/tokens';
import { getSupabaseClient, type AppSupabaseClient } from '@/lib/supabase';

import { type CommunityPost } from './communityService';
import { useCommunityStore } from './communityStore';
import { PostCard } from './PostCard';
import { PostComposer } from './PostComposer';
import { SpaceChooser } from './SpaceChooser';

export interface CommunityFeedScreenProps {
  /** Injectable for tests; defaults to the app's Supabase client at call time. */
  client?: AppSupabaseClient;
  /** Slot passed to every PostCard (e.g. community media). */
  renderMedia?: (post: CommunityPost) => ReactNode;
  /** Slot passed to every PostCard (e.g. report / block actions). */
  renderActions?: (post: CommunityPost) => ReactNode;
  /** Optional attachment UI rendered inside the composer (e.g. an image picker). */
  composerAttachment?: ReactNode;
  /** Called after a post is created (e.g. to upload its attached image). */
  onPostCreated?: (post: CommunityPost) => Promise<void> | void;
}

/** A gentle, pressure-free note that posting and support are part of Pro. */
function ProNote() {
  return (
    <Card>
      <View style={{ gap: spacing.sm }}>
        <SectionTitle>{copy.proNoteTitle}</SectionTitle>
        <Body>{copy.proNoteBody}</Body>
      </View>
    </Card>
  );
}

function FeedSkeleton() {
  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={copy.loadingLabel}
      style={{ gap: spacing.md }}
    >
      {[0, 1].map((key) => (
        <Card key={key}>
          <View style={{ gap: spacing.sm }}>
            <Skeleton width="40%" height={12} />
            <Skeleton height={14} />
            <Skeleton width="80%" height={14} />
          </View>
        </Card>
      ))}
    </View>
  );
}

/**
 * Community spaces (issue #38). The viewer chooses a space (recovery or gentle
 * weight care); each space has its own feed. Reading is free; posting and quiet
 * support are Pro (shown only when `is_pro()` says so — the server enforces it
 * regardless). There are no counts anywhere on this screen.
 */
export function CommunityFeedScreen({
  client,
  renderMedia,
  renderActions,
  composerAttachment,
  onPostCreated,
}: CommunityFeedScreenProps) {
  const ready = useCommunityStore((state) => state.ready);
  const space = useCommunityStore((state) => state.space);
  const posts = useCommunityStore((state) => state.posts);
  const status = useCommunityStore((state) => state.status);
  const viewerId = useCommunityStore((state) => state.viewerId);
  const isPro = useCommunityStore((state) => state.isPro);
  const mySupport = useCommunityStore((state) => state.mySupport);
  const receivedSupport = useCommunityStore((state) => state.receivedSupport);
  const actionError = useCommunityStore((state) => state.actionError);
  const init = useCommunityStore((state) => state.init);
  const chooseSpace = useCommunityStore((state) => state.chooseSpace);
  const load = useCommunityStore((state) => state.load);
  const post = useCommunityStore((state) => state.post);
  const remove = useCommunityStore((state) => state.remove);
  const toggleSupport = useCommunityStore((state) => state.toggleSupport);
  const clearActionError = useCommunityStore((state) => state.clearActionError);

  const resolveClient = (): AppSupabaseClient => client ?? getSupabaseClient();

  useEffect(() => {
    void init(resolveClient());
    // Initialise once on mount; retries are explicit via the error state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isLoading = status === 'loading' && posts.length === 0;
  const isLoadError = status === 'error' && posts.length === 0;

  return (
    <View style={{ gap: spacing.xl }}>
      <View style={{ gap: spacing.xs }}>
        <PageTitle>{copy.title}</PageTitle>
        <Body>{copy.intro}</Body>
      </View>

      <SpaceChooser
        selected={space}
        onSelect={(next) => {
          if (next !== space) void chooseSpace(resolveClient(), next);
        }}
      />

      {!ready ? <FeedSkeleton /> : null}

      {ready && !space ? <Body>{copy.chooserPrompt}</Body> : null}

      {ready && space ? (
        <>
          {isPro ? (
            <PostComposer
              attachment={composerAttachment}
              onSubmit={async (body) => {
                const created = await post(resolveClient(), body);
                if (!created) return false;
                await onPostCreated?.(created);
                return true;
              }}
            />
          ) : (
            <ProNote />
          )}

          {actionError ? (
            <ErrorState
              title={copy.actionErrorTitle}
              message={copy.actionErrorBody}
              retryLabel={copy.dismiss}
              onRetry={clearActionError}
            />
          ) : null}

          <View style={{ gap: spacing.md }}>
            <SectionTitle>{copy.feedTitle}</SectionTitle>

            {isLoading ? <FeedSkeleton /> : null}

            {isLoadError ? (
              <ErrorState
                title={copy.loadErrorTitle}
                message={copy.loadErrorBody}
                retryLabel={copy.retry}
                onRetry={() => void load(resolveClient())}
              />
            ) : null}

            {status === 'loaded' && posts.length === 0 ? (
              <EmptyState
                title={copy.emptyTitle}
                body={copy.emptyBody}
                illustration="leaves"
              />
            ) : null}

            {posts.map((item) => (
              <PostCard
                key={item.id}
                post={item}
                viewerId={viewerId}
                canSupport={isPro}
                supported={mySupport[item.id] === true}
                receivedSupport={receivedSupport[item.id] === true}
                onToggleSupport={(target) =>
                  void toggleSupport(resolveClient(), target.id)
                }
                onDelete={(target) => remove(resolveClient(), target.id)}
                renderMedia={renderMedia}
                renderActions={renderActions}
              />
            ))}
          </View>
        </>
      ) : null}
    </View>
  );
}

export default CommunityFeedScreen;
