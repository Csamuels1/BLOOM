import { useState } from 'react';
import { View } from 'react-native';

import { Body, Button, Caption } from '@/components';
import { reportingCopy as copy } from '@/content/reporting';
import { spacing } from '@/design/tokens';
import { getSupabaseClient, type AppSupabaseClient } from '@/lib/supabase';

import { ConfirmPanel } from './ConfirmPanel';
import { ReportSheet } from './ReportSheet';
import { useReportingStore } from './reportingStore';

export interface PostSafetyActionsProps {
  postId: string;
  /** The post author's user id. */
  authorId: string;
  /** The signed-in user's id; null/undefined while unknown (renders nothing). */
  currentUserId: string | null | undefined;
  /** Called once a block succeeds so the host can drop the author's posts now. */
  onBlocked?: (authorId: string) => void;
  /** Injectable for tests; defaults to the app's Supabase client at call time. */
  client?: AppSupabaseClient;
}

type Mode = 'idle' | 'reporting' | 'confirmBlock' | 'blocked';

/**
 * Report / Block actions for a community post written by someone else
 * (issue #40). Hidden entirely on your own posts (and while the viewer is
 * unknown). Blocking is immediate and calm; the server then hides both
 * members' posts, reactions and media from each other in both directions.
 */
export function PostSafetyActions({
  postId,
  authorId,
  currentUserId,
  onBlocked,
  client,
}: PostSafetyActionsProps) {
  const block = useReportingStore((state) => state.block);
  const [mode, setMode] = useState<Mode>('idle');
  const [busy, setBusy] = useState(false);
  const [blockError, setBlockError] = useState(false);

  if (!currentUserId || currentUserId === authorId) {
    return null;
  }

  async function handleBlock() {
    setBusy(true);
    setBlockError(false);
    const ok = await block(client ?? getSupabaseClient(), authorId);
    setBusy(false);
    if (ok) {
      setMode('blocked');
      onBlocked?.(authorId);
    } else {
      setBlockError(true);
    }
  }

  if (mode === 'reporting') {
    return (
      <ReportSheet
        postId={postId}
        client={client}
        onClose={() => setMode('idle')}
      />
    );
  }

  if (mode === 'blocked') {
    return (
      <View accessibilityLiveRegion="polite">
        <Body>{copy.blockedDone}</Body>
      </View>
    );
  }

  if (mode === 'confirmBlock') {
    return (
      <View style={{ gap: spacing.sm }}>
        <ConfirmPanel
          message={copy.blockConfirmBody}
          confirmLabel={copy.blockConfirm}
          cancelLabel={copy.blockCancel}
          busy={busy}
          onConfirm={() => void handleBlock()}
          onCancel={() => {
            setBlockError(false);
            setMode('idle');
          }}
        />
        {blockError ? (
          <Caption color="terracotta" accessibilityLiveRegion="polite">
            {copy.blockErrorBody}
          </Caption>
        ) : null}
      </View>
    );
  }

  return (
    <View style={{ flexDirection: 'row', gap: spacing.sm }}>
      <Button
        label={copy.reportAction}
        accessibilityLabel={copy.reportActionLabel}
        variant="ghost"
        onPress={() => setMode('reporting')}
      />
      <Button
        label={copy.blockAction}
        accessibilityLabel={copy.blockActionLabel}
        variant="ghost"
        onPress={() => setMode('confirmBlock')}
      />
    </View>
  );
}

export default PostSafetyActions;
