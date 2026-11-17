import { useEffect, useState } from 'react';
import { View } from 'react-native';

import {
  Body,
  Button,
  Caption,
  Card,
  EmptyState,
  ErrorState,
  PageTitle,
  SectionTitle,
} from '@/components';
import { reportingCopy as copy } from '@/content/reporting';
import { spacing } from '@/design/tokens';
import { getSupabaseClient, type AppSupabaseClient } from '@/lib/supabase';

import { ConfirmPanel } from './ConfirmPanel';
import { formatDate } from './format';
import type { MyBlock } from './reportingService';
import { useReportingStore } from './reportingStore';

export interface BlockedMembersScreenProps {
  /** Injectable for tests; defaults to the app's Supabase client at call time. */
  client?: AppSupabaseClient;
  /** Optional display-name lookup; falls back to a neutral label. */
  getMemberLabel?: (memberId: string) => string | null | undefined;
}

/**
 * The caller's blocked members with a calm unblock confirmation (issue #40).
 * Blocks are owned by the blocker (RLS); the blocked person is never told.
 */
export function BlockedMembersScreen({
  client,
  getMemberLabel,
}: BlockedMembersScreenProps) {
  const blocks = useReportingStore((state) => state.blocks);
  const status = useReportingStore((state) => state.blocksStatus);
  const loadBlocks = useReportingStore((state) => state.loadBlocks);
  const unblock = useReportingStore((state) => state.unblock);

  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [failedId, setFailedId] = useState<string | null>(null);

  const resolveClient = (): AppSupabaseClient => client ?? getSupabaseClient();

  useEffect(() => {
    void loadBlocks(resolveClient());
    // Load once on mount; retries are explicit via the error state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleUnblock(memberId: string) {
    setBusyId(memberId);
    setFailedId(null);
    const ok = await unblock(resolveClient(), memberId);
    setBusyId(null);
    if (ok) {
      setConfirmingId(null);
    } else {
      setFailedId(memberId);
    }
  }

  const isLoading = status === 'loading' && blocks.length === 0;
  const isLoadError = status === 'error' && blocks.length === 0;

  return (
    <View style={{ gap: spacing.xl }}>
      <View style={{ gap: spacing.xs }}>
        <PageTitle>{copy.blockedTitle}</PageTitle>
        <Body>{copy.blockedIntro}</Body>
      </View>

      {isLoading ? (
        <Caption color="plum" accessibilityRole="progressbar">
          {copy.loadingLabel}
        </Caption>
      ) : null}

      {isLoadError ? (
        <ErrorState
          title={copy.blocksLoadErrorTitle}
          message={copy.blocksLoadErrorBody}
          retryLabel={copy.retry}
          onRetry={() => void loadBlocks(resolveClient())}
        />
      ) : null}

      {status === 'loaded' && blocks.length === 0 ? (
        <EmptyState
          title={copy.blockedEmptyTitle}
          body={copy.blockedEmptyBody}
        />
      ) : null}

      <View style={{ gap: spacing.md }}>
        {blocks.map((entry) => (
          <BlockedRow
            key={entry.blocked_id}
            entry={entry}
            label={
              getMemberLabel?.(entry.blocked_id) ?? copy.blockedMemberFallback
            }
            confirming={confirmingId === entry.blocked_id}
            busy={busyId === entry.blocked_id}
            failed={failedId === entry.blocked_id}
            onAsk={() => {
              setFailedId(null);
              setConfirmingId(entry.blocked_id);
            }}
            onCancel={() => setConfirmingId(null)}
            onConfirm={() => void handleUnblock(entry.blocked_id)}
          />
        ))}
      </View>
    </View>
  );
}

interface BlockedRowProps {
  entry: MyBlock;
  label: string;
  confirming: boolean;
  busy: boolean;
  failed: boolean;
  onAsk: () => void;
  onCancel: () => void;
  onConfirm: () => void;
}

function BlockedRow({
  entry,
  label,
  confirming,
  busy,
  failed,
  onAsk,
  onCancel,
  onConfirm,
}: BlockedRowProps) {
  return (
    <Card>
      <View style={{ gap: spacing.sm }}>
        <SectionTitle>{label}</SectionTitle>
        <Caption color="plum">
          {`${copy.blockedSince} ${formatDate(entry.created_at)}`}
        </Caption>
        {confirming ? (
          <ConfirmPanel
            message={copy.unblockConfirmBody}
            confirmLabel={copy.unblockConfirm}
            cancelLabel={copy.unblockCancel}
            busy={busy}
            onConfirm={onConfirm}
            onCancel={onCancel}
          />
        ) : (
          <Button
            label={copy.unblockAction}
            accessibilityLabel={`${copy.unblockAction} ${label}`}
            variant="ghost"
            onPress={onAsk}
          />
        )}
        {failed ? (
          <Caption color="terracotta" accessibilityLiveRegion="polite">
            {copy.unblockErrorBody}
          </Caption>
        ) : null}
      </View>
    </Card>
  );
}

export default BlockedMembersScreen;
