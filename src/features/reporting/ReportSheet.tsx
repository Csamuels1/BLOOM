import { useState } from 'react';
import { View } from 'react-native';

import {
  Body,
  Button,
  Card,
  ChoiceCard,
  ErrorState,
  SectionTitle,
  TextField,
} from '@/components';
import { reportingCopy as copy } from '@/content/reporting';
import { spacing } from '@/design/tokens';
import { getSupabaseClient, type AppSupabaseClient } from '@/lib/supabase';

import {
  MAX_REPORT_DETAILS_LENGTH,
  REPORT_REASONS,
  type ReportOutcome,
  type ReportReason,
} from './reportingService';
import { useReportingStore } from './reportingStore';

export const reasonCopy: Record<ReportReason, { title: string; hint: string }> =
  {
    spam: { title: copy.reasonSpam, hint: copy.reasonSpamHint },
    harassment: {
      title: copy.reasonHarassment,
      hint: copy.reasonHarassmentHint,
    },
    unsafe: { title: copy.reasonUnsafe, hint: copy.reasonUnsafeHint },
    other: { title: copy.reasonOther, hint: copy.reasonOtherHint },
  };

export interface ReportSheetProps {
  postId: string;
  /** Close the sheet (cancel, or "Done" after the private confirmation). */
  onClose: () => void;
  /** Injectable for tests; defaults to the app's Supabase client at call time. */
  client?: AppSupabaseClient;
}

/**
 * Report a post (issue #40): choose a reason, optionally add details (≤1000),
 * then see a private confirmation. The reported person is never told who
 * reported them; the server hides reports from authors entirely. A repeat
 * report is acknowledged gently rather than shown as an error. Render inside a
 * Modal / bottom sheet container from the host screen.
 */
export function ReportSheet({ postId, onClose, client }: ReportSheetProps) {
  const report = useReportingStore((state) => state.report);
  const clearError = useReportingStore((state) => state.clearError);

  const [reason, setReason] = useState<ReportReason | null>(null);
  const [details, setDetails] = useState('');
  const [validation, setValidation] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [failed, setFailed] = useState(false);
  const [outcome, setOutcome] = useState<ReportOutcome | null>(null);

  const detailsTooLong = details.length > MAX_REPORT_DETAILS_LENGTH;

  async function handleSubmit() {
    if (!reason) {
      setValidation(copy.reasonRequired);
      return;
    }
    if (detailsTooLong) {
      return;
    }
    setValidation(null);
    setFailed(false);
    setSubmitting(true);
    const result = await report(client ?? getSupabaseClient(), {
      postId,
      reason,
      details: details.length > 0 ? details : null,
    });
    setSubmitting(false);
    if (result) {
      setOutcome(result);
    } else {
      // Keep the chosen reason and typed details; offer a retry.
      setFailed(true);
    }
  }

  if (outcome) {
    const already = outcome === 'already_reported';
    return (
      <Card>
        <View style={{ gap: spacing.md }} accessibilityLiveRegion="polite">
          <SectionTitle>
            {already ? copy.alreadyReportedTitle : copy.reportSentTitle}
          </SectionTitle>
          <Body>
            {already ? copy.alreadyReportedBody : copy.reportSentBody}
          </Body>
          <Button label={copy.reportDone} onPress={onClose} />
        </View>
      </Card>
    );
  }

  return (
    <Card>
      <View style={{ gap: spacing.lg }}>
        <View style={{ gap: spacing.xs }}>
          <SectionTitle>{copy.reportTitle}</SectionTitle>
          <Body>{copy.reportIntro}</Body>
        </View>

        <View
          accessibilityRole="radiogroup"
          accessibilityLabel={copy.reasonGroupLabel}
          style={{ gap: spacing.sm }}
        >
          <Body>{copy.reasonGroupLabel}</Body>
          {REPORT_REASONS.map((value) => (
            <ChoiceCard
              key={value}
              title={reasonCopy[value].title}
              body={reasonCopy[value].hint}
              selected={reason === value}
              onSelect={() => {
                setReason(value);
                setValidation(null);
              }}
            />
          ))}
          {validation ? <Body color="terracotta">{validation}</Body> : null}
        </View>

        <TextField
          label={copy.detailsLabel}
          hint={copy.detailsHint}
          value={details}
          onChangeText={(text) => {
            setDetails(text);
            if (failed) {
              setFailed(false);
              clearError();
            }
          }}
          multiline
          error={detailsTooLong ? copy.detailsTooLong : undefined}
        />

        {failed ? (
          <ErrorState
            title={copy.reportErrorTitle}
            message={copy.reportErrorBody}
            retryLabel={copy.retry}
            onRetry={() => void handleSubmit()}
          />
        ) : null}

        <View style={{ gap: spacing.sm }}>
          <Button
            label={submitting ? copy.submittingReport : copy.submitReport}
            onPress={() => void handleSubmit()}
            loading={submitting}
            disabled={submitting || detailsTooLong}
          />
          <Button label={copy.cancelReport} variant="ghost" onPress={onClose} />
        </View>
      </View>
    </Card>
  );
}

export default ReportSheet;
