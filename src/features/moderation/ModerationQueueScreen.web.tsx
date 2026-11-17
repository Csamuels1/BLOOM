import { useEffect, useState } from 'react';
import { Image, View } from 'react-native';

import {
  Body,
  Button,
  Caption,
  Card,
  EmptyState,
  ErrorState,
  Pill,
  SectionTitle,
  TextField,
} from '@/components';
import { moderationCopy as copy } from '@/content/moderation';
import { colors, radii, spacing } from '@/design/tokens';
import { useAuthStore } from '@/features/auth';
import { getSupabaseClient } from '@/lib/supabase';

import {
  isModeratorSession,
  type HistoryItem,
  type PendingMediaItem,
  type QueueReport,
} from './moderationService';
import { useModerationStore } from './moderationStore';

/**
 * Web-only staff moderation queue (issue #41).
 *
 * Authorization is enforced by the server, not here: the cosmetic
 * {@link isModeratorSession} gate only decides whether to render the queue, and
 * every read (RLS) and action (SECURITY DEFINER RPC) is re-checked server-side.
 * Metro resolves this file for web; native builds get the stub instead, so this
 * data layer never ships in the mobile app.
 */

const REASON_LABELS: Record<string, string> = {
  spam: copy.reasonSpam,
  harassment: copy.reasonHarassment,
  unsafe: copy.reasonUnsafe,
  other: copy.reasonOther,
};

const POST_STATUS_LABELS: Record<string, string> = {
  pending: copy.statusPending,
  approved: copy.statusApproved,
  removed: copy.statusRemoved,
};

const REPORT_STATUS_LABELS: Record<string, string> = {
  open: copy.reportOpen,
  reviewing: copy.reportReviewing,
  resolved: copy.reportResolved,
  dismissed: copy.reportDismissed,
};

const ACTION_LABELS: Record<string, string> = {
  approve: copy.actionApprove,
  remove: copy.actionRemove,
  start_review: copy.actionStartReview,
  resolve_report: copy.actionResolveReport,
  dismiss_report: copy.actionDismissReport,
};

const TARGET_LABELS: Record<string, string> = {
  post: copy.targetPost,
  media: copy.targetMedia,
  report: copy.targetReport,
};

type Tab = 'reports' | 'media' | 'history';

/** Describe a report reason in plain language. */
export function describeReason(reason: string): string {
  return REASON_LABELS[reason] ?? copy.reasonOther;
}

/** Describe an audit entry in one calm sentence. */
export function describeAction(item: HistoryItem): string {
  const verb = ACTION_LABELS[item.action] ?? item.action;
  const target = TARGET_LABELS[item.targetType] ?? item.targetType;
  return `${verb} ${target}`;
}

function shortTime(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleString();
}

/** Optional, reusable note field for the record. */
function ReasonField({
  value,
  onChangeText,
}: {
  value: string;
  onChangeText: (next: string) => void;
}) {
  return (
    <TextField
      label={copy.reasonFieldLabel}
      hint={copy.reasonFieldHint}
      value={value}
      onChangeText={onChangeText}
      multiline
      maxLength={1000}
    />
  );
}

function StatusBadge({ label }: { label: string }) {
  return (
    <View
      style={{
        alignSelf: 'flex-start',
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs,
        borderRadius: radii.pill,
        borderWidth: 1,
        borderColor: colors.mutedSage,
      }}
    >
      <Caption>{label}</Caption>
    </View>
  );
}

function ReportCard({ report }: { report: QueueReport }) {
  const [note, setNote] = useState('');
  const pendingId = useModerationStore((s) => s.pendingId);
  const actOnReport = useModerationStore((s) => s.actOnReport);
  const actOnPost = useModerationStore((s) => s.actOnPost);
  const busy = pendingId === report.id || pendingId === report.postId;

  const client = getSupabaseClient();
  const noteOrNull = () => (note.trim() ? note : null);

  return (
    <Card tone="plain" style={{ gap: spacing.md }}>
      <View style={{ gap: spacing.xs }}>
        <Caption>
          {copy.reportReasonPrefix} {describeReason(report.reason)}
        </Caption>
        <Body>{report.postBody || copy.memberFallback}</Body>
      </View>

      {report.details ? (
        <View style={{ gap: spacing.xs }}>
          <Caption>{copy.reportDetailsLabel}</Caption>
          <Body>{report.details}</Body>
        </View>
      ) : null}

      <View style={{ flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' }}>
        <StatusBadge
          label={`${copy.postStatusLabel}: ${POST_STATUS_LABELS[report.postStatus] ?? report.postStatus}`}
        />
        <StatusBadge
          label={REPORT_STATUS_LABELS[report.status] ?? report.status}
        />
        <StatusBadge
          label={`${copy.reportedOn} ${shortTime(report.createdAt)}`}
        />
      </View>

      <ReasonField value={note} onChangeText={setNote} />

      <View style={{ gap: spacing.sm }}>
        {report.status === 'open' ? (
          <Button
            label={copy.startReview}
            variant="secondary"
            disabled={busy}
            onPress={() => {
              void actOnReport(client, report.id, 'start_review', noteOrNull());
            }}
          />
        ) : null}
        <View
          style={{ flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' }}
        >
          <View style={{ flexGrow: 1, minWidth: 140 }}>
            <Button
              label={copy.removePost}
              disabled={busy || report.postStatus === 'removed'}
              onPress={() => {
                void actOnPost(client, report.postId, 'remove', noteOrNull());
              }}
            />
          </View>
          <View style={{ flexGrow: 1, minWidth: 140 }}>
            <Button
              label={copy.approvePost}
              variant="secondary"
              disabled={busy || report.postStatus === 'approved'}
              onPress={() => {
                void actOnPost(client, report.postId, 'approve', noteOrNull());
              }}
            />
          </View>
        </View>
        <View
          style={{ flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' }}
        >
          <View style={{ flexGrow: 1, minWidth: 140 }}>
            <Button
              label={copy.resolveReport}
              variant="ghost"
              disabled={busy}
              onPress={() => {
                void actOnReport(
                  client,
                  report.id,
                  'resolve_report',
                  noteOrNull(),
                );
              }}
            />
          </View>
          <View style={{ flexGrow: 1, minWidth: 140 }}>
            <Button
              label={copy.dismissReport}
              variant="ghost"
              disabled={busy}
              onPress={() => {
                void actOnReport(
                  client,
                  report.id,
                  'dismiss_report',
                  noteOrNull(),
                );
              }}
            />
          </View>
        </View>
      </View>
    </Card>
  );
}

function MediaCard({ item }: { item: PendingMediaItem }) {
  const [note, setNote] = useState('');
  const pendingId = useModerationStore((s) => s.pendingId);
  const actOnMedia = useModerationStore((s) => s.actOnMedia);
  const busy = pendingId === item.id;
  const client = getSupabaseClient();
  const noteOrNull = () => (note.trim() ? note : null);

  return (
    <Card tone="plain" style={{ gap: spacing.md }}>
      {item.previewUrl ? (
        <Image
          source={{ uri: item.previewUrl }}
          accessibilityLabel={copy.tabMedia}
          resizeMode="cover"
          style={{
            width: '100%',
            aspectRatio: 1,
            maxWidth: 320,
            borderRadius: radii.card,
            backgroundColor: colors.mutedSage,
          }}
        />
      ) : (
        <StatusBadge label={copy.loadErrorTitle} />
      )}
      <Body>{item.postBody || copy.memberFallback}</Body>
      <View style={{ flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' }}>
        <StatusBadge label={copy.statusPending} />
        <StatusBadge
          label={`${copy.reportedOn} ${shortTime(item.createdAt)}`}
        />
      </View>

      <ReasonField value={note} onChangeText={setNote} />
      <View style={{ flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' }}>
        <View style={{ flexGrow: 1, minWidth: 140 }}>
          <Button
            label={copy.approveMedia}
            variant="secondary"
            disabled={busy}
            onPress={() => {
              void actOnMedia(client, item.id, 'approve', noteOrNull());
            }}
          />
        </View>
        <View style={{ flexGrow: 1, minWidth: 140 }}>
          <Button
            label={copy.rejectMedia}
            disabled={busy}
            onPress={() => {
              void actOnMedia(client, item.id, 'remove', noteOrNull());
            }}
          />
        </View>
      </View>
    </Card>
  );
}

function HistoryList({ items }: { items: HistoryItem[] }) {
  if (items.length === 0) {
    return (
      <EmptyState title={copy.historyEmptyTitle} body={copy.historyEmptyBody} />
    );
  }
  return (
    <View style={{ gap: spacing.sm }}>
      <Caption>{copy.historyIntro}</Caption>
      {items.map((item) => (
        <Card key={item.id} tone="plain" style={{ gap: spacing.xs }}>
          <Body>{describeAction(item)}</Body>
          <Caption>
            {copy.actedAt} {shortTime(item.createdAt)}
          </Caption>
          {item.reason ? <Caption>{item.reason}</Caption> : null}
        </Card>
      ))}
    </View>
  );
}

export type ModerationQueueScreenProps = Record<string, never>;

export function ModerationQueueScreen() {
  const session = useAuthStore((s) => s.session);
  const [tab, setTab] = useState<Tab>('reports');

  const reports = useModerationStore((s) => s.reports);
  const reportsStatus = useModerationStore((s) => s.reportsStatus);
  const media = useModerationStore((s) => s.media);
  const mediaStatus = useModerationStore((s) => s.mediaStatus);
  const history = useModerationStore((s) => s.history);
  const historyStatus = useModerationStore((s) => s.historyStatus);
  const error = useModerationStore((s) => s.error);
  const notAuthorized = useModerationStore((s) => s.notAuthorized);
  const loadAll = useModerationStore((s) => s.loadAll);
  const clearError = useModerationStore((s) => s.clearError);

  const canModerate = isModeratorSession(session);

  useEffect(() => {
    if (canModerate) {
      void loadAll(getSupabaseClient());
    }
  }, [canModerate, loadAll]);

  if (!canModerate) {
    return (
      <View style={{ gap: spacing.md }}>
        <SectionTitle>{copy.accessTitle}</SectionTitle>
        <Body>{copy.accessBody}</Body>
      </View>
    );
  }

  const loading =
    reportsStatus === 'loading' ||
    mediaStatus === 'loading' ||
    historyStatus === 'loading';

  return (
    <View style={{ gap: spacing.lg }}>
      <View style={{ gap: spacing.xs }}>
        <SectionTitle>{copy.title}</SectionTitle>
        <Caption>{copy.intro}</Caption>
      </View>

      <View style={{ flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' }}>
        <Pill
          label={`${copy.tabReports} (${reports.length})`}
          selected={tab === 'reports'}
          onPress={() => setTab('reports')}
        />
        <Pill
          label={`${copy.tabMedia} (${media.length})`}
          selected={tab === 'media'}
          onPress={() => setTab('media')}
        />
        <Pill
          label={copy.tabHistory}
          selected={tab === 'history'}
          onPress={() => setTab('history')}
        />
      </View>

      {error ? (
        <ErrorState
          title={notAuthorized ? copy.actionErrorTitle : copy.loadErrorTitle}
          message={notAuthorized ? copy.notAuthorizedError : error}
          retryLabel={copy.retry}
          onRetry={() => {
            clearError();
            void loadAll(getSupabaseClient());
          }}
        />
      ) : null}

      {loading ? (
        <Caption accessibilityLiveRegion="polite">{copy.loading}</Caption>
      ) : null}

      {tab === 'reports' ? (
        reports.length === 0 && reportsStatus === 'loaded' ? (
          <EmptyState
            title={copy.reportsEmptyTitle}
            body={copy.reportsEmptyBody}
          />
        ) : (
          <View style={{ gap: spacing.md }}>
            {reports.map((report) => (
              <ReportCard key={report.id} report={report} />
            ))}
          </View>
        )
      ) : null}

      {tab === 'media' ? (
        media.length === 0 && mediaStatus === 'loaded' ? (
          <EmptyState title={copy.mediaEmptyTitle} body={copy.mediaEmptyBody} />
        ) : (
          <View style={{ gap: spacing.md }}>
            {media.map((item) => (
              <MediaCard key={item.id} item={item} />
            ))}
          </View>
        )
      ) : null}

      {tab === 'history' ? <HistoryList items={history} /> : null}
    </View>
  );
}
