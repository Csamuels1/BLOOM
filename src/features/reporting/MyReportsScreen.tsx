import { useEffect } from 'react';
import { View } from 'react-native';

import {
  Body,
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

import { formatDate } from './format';
import { reasonCopy } from './ReportSheet';
import {
  isReportReason,
  isReportStatus,
  type MyReport,
  type ReportStatus,
} from './reportingService';
import { useReportingStore } from './reportingStore';

const statusCopy: Record<ReportStatus, string> = {
  open: copy.statusOpen,
  reviewing: copy.statusReviewing,
  resolved: copy.statusResolved,
  dismissed: copy.statusDismissed,
};

/** Plain-language status for a report (read-only; members cannot change it). */
export function describeReportStatus(status: string): string {
  return isReportStatus(status) ? statusCopy[status] : copy.statusUnknown;
}

export interface MyReportsScreenProps {
  /** Injectable for tests; defaults to the app's Supabase client at call time. */
  client?: AppSupabaseClient;
}

/**
 * The caller's own reports and where they are (issue #40). Only the caller's
 * reports are loaded (service filters reporter_id = caller; RLS also scopes
 * members), and no reporter identity is rendered for anyone. Status is
 * read-only: there is no member control to change it.
 */
export function MyReportsScreen({ client }: MyReportsScreenProps) {
  const reports = useReportingStore((state) => state.reports);
  const status = useReportingStore((state) => state.reportsStatus);
  const loadReports = useReportingStore((state) => state.loadReports);

  const resolveClient = (): AppSupabaseClient => client ?? getSupabaseClient();

  useEffect(() => {
    void loadReports(resolveClient());
    // Load once on mount; retries are explicit via the error state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isLoading = status === 'loading' && reports.length === 0;
  const isLoadError = status === 'error' && reports.length === 0;

  return (
    <View style={{ gap: spacing.xl }}>
      <View style={{ gap: spacing.xs }}>
        <PageTitle>{copy.myReportsTitle}</PageTitle>
        <Body>{copy.myReportsIntro}</Body>
      </View>

      {isLoading ? (
        <Caption color="plum" accessibilityRole="progressbar">
          {copy.loadingLabel}
        </Caption>
      ) : null}

      {isLoadError ? (
        <ErrorState
          title={copy.reportsLoadErrorTitle}
          message={copy.reportsLoadErrorBody}
          retryLabel={copy.retry}
          onRetry={() => void loadReports(resolveClient())}
        />
      ) : null}

      {status === 'loaded' && reports.length === 0 ? (
        <EmptyState
          title={copy.myReportsEmptyTitle}
          body={copy.myReportsEmptyBody}
        />
      ) : null}

      <View style={{ gap: spacing.md }}>
        {reports.map((item) => (
          <ReportRow key={item.id} report={item} />
        ))}
      </View>
    </View>
  );
}

function ReportRow({ report }: { report: MyReport }) {
  const reasonLabel = isReportReason(report.reason)
    ? reasonCopy[report.reason].title
    : copy.reasonOther;
  return (
    <Card>
      <View style={{ gap: spacing.xs }}>
        <SectionTitle>{describeReportStatus(report.status)}</SectionTitle>
        <Body>{`${copy.reasonPrefix}: ${reasonLabel}`}</Body>
        <Caption color="plum">
          {`${copy.reportedOn} ${formatDate(report.created_at)}`}
        </Caption>
      </View>
    </Card>
  );
}

export default MyReportsScreen;
