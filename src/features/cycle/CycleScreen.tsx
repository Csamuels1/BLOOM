import { useEffect, useMemo, useState } from 'react';
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
import { cycleCopy as copy } from '@/content/cycle';
import { colors, radii, spacing } from '@/design/tokens';
import { getSupabaseClient, type AppSupabaseClient } from '@/lib/supabase';

import { CycleInsightCard } from './CycleInsightCard';
import { CycleStartForm } from './CycleStartForm';
import { localDateString, type CycleStart } from './cycleService';
import { useCycleStore } from './cycleStore';
import { estimateCycleInsight } from './insights';

export interface CycleScreenProps {
  /** Injectable for tests; defaults to the app's Supabase client at call time. */
  client?: AppSupabaseClient;
  /** Whether cycle tracking is on. Defaults to on; injectable for tests. */
  tracking?: boolean;
  /**
   * Called after the user turns tracking on or off. The history decision
   * (keep vs delete) has already been applied when `false` is reported, so the
   * caller only needs to persist the `track_cycle` preference.
   */
  onTrackingChange?: (tracking: boolean) => void;
  /** Injectable "today" (YYYY-MM-DD) for deterministic tests. */
  today?: string;
}

/** A readable start date, locale-aware, with no timezone shifting. */
function formatDate(isoDate: string): string {
  try {
    return new Intl.DateTimeFormat(undefined, {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(new Date(`${isoDate}T00:00:00`));
  } catch {
    return isoDate;
  }
}

/**
 * Optional cycle logging screen (issue #34). Start dates support full CRUD; the
 * estimated insight is always framed as a rough, non-diagnostic guide with
 * explicit uncertainty. Turning tracking off never silently drops history: the
 * person is asked to keep or delete their dates, and the choice is applied
 * visibly. Saving is resilient — a failed action keeps the user's input and
 * offers a gentle retry.
 */
export function CycleScreen({
  client,
  tracking = true,
  onTrackingChange,
  today,
}: CycleScreenProps) {
  const entries = useCycleStore((state) => state.entries);
  const status = useCycleStore((state) => state.status);
  const error = useCycleStore((state) => state.error);
  const load = useCycleStore((state) => state.load);
  const add = useCycleStore((state) => state.add);
  const remove = useCycleStore((state) => state.remove);
  const clearHistory = useCycleStore((state) => state.clearHistory);
  const clearError = useCycleStore((state) => state.clearError);

  const [trackingOn, setTrackingOn] = useState(tracking);
  // Stay in step with the parent's `tracking` (server truth). If the parent
  // reverts after a failed save, the screen reverts too. This adjusts state
  // during render rather than in an effect, as React recommends.
  const [syncedTracking, setSyncedTracking] = useState(tracking);
  if (tracking !== syncedTracking) {
    setSyncedTracking(tracking);
    setTrackingOn(tracking);
  }
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [confirmingDisable, setConfirmingDisable] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const resolveClient = (): AppSupabaseClient => client ?? getSupabaseClient();

  useEffect(() => {
    void load(resolveClient());
    // Load once on mount; retries are explicit via the error state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const editingEntry = useMemo(
    () => entries.find((entry) => entry.id === editingId) ?? null,
    [entries, editingId],
  );

  const insight = useMemo(
    () =>
      estimateCycleInsight(
        entries.map((entry) => entry.started_on),
        today ?? localDateString(),
      ),
    [entries, today],
  );

  async function handleAdd(startedOn: string): Promise<boolean> {
    setSubmitting(true);
    const ok = await add(resolveClient(), startedOn);
    setSubmitting(false);
    // Lets the form show its brief, neutral "Saved" confirmation (#153).
    return ok;
  }

  async function handleUpdate(startedOn: string) {
    if (!editingId) return;
    setSubmitting(true);
    // A start date edit is a remove-then-add: the row stores only the date, and
    // this keeps the service surface small while respecting the unique-per-day
    // constraint.
    const added = await add(resolveClient(), startedOn);
    if (added) {
      await remove(resolveClient(), editingId);
      setEditingId(null);
    }
    setSubmitting(false);
  }

  async function handleDelete(id: string) {
    const ok = await remove(resolveClient(), id);
    if (ok) {
      setPendingDeleteId(null);
    }
  }

  function enableTracking() {
    setTrackingOn(true);
    onTrackingChange?.(true);
  }

  function disableKeepingHistory() {
    setConfirmingDisable(false);
    setTrackingOn(false);
    onTrackingChange?.(false);
  }

  async function disableDeletingHistory() {
    const ok = await clearHistory(resolveClient());
    if (!ok) {
      // Keep the prompt open and the dates intact; the error notice shows below.
      return;
    }
    setConfirmingDisable(false);
    setTrackingOn(false);
    onTrackingChange?.(false);
  }

  const isLoading = status === 'loading';
  const isLoadError = status === 'error' && entries.length === 0;

  return (
    <View style={{ gap: spacing.xl }}>
      <View style={{ gap: spacing.xs }}>
        <PageTitle>{copy.title}</PageTitle>
        <Body>{copy.intro}</Body>
      </View>

      {/* Tracking on/off with an explicit disable flow. */}
      <View style={{ gap: spacing.md }}>
        <SectionTitle>{copy.trackingSectionTitle}</SectionTitle>
        <Body>{trackingOn ? copy.trackingOnBody : copy.trackingOffBody}</Body>

        {trackingOn ? (
          confirmingDisable ? (
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
              <SectionTitle>{copy.disablePromptTitle}</SectionTitle>
              <Body>{copy.disablePromptBody}</Body>
              <Button
                label={copy.disableKeepHistory}
                variant="secondary"
                onPress={disableKeepingHistory}
              />
              <Button
                label={copy.disableDeleteHistory}
                variant="secondary"
                onPress={() => void disableDeletingHistory()}
              />
              <Button
                label={copy.disableCancel}
                variant="ghost"
                onPress={() => setConfirmingDisable(false)}
              />
            </View>
          ) : (
            <Button
              label={copy.turnOffAction}
              variant="ghost"
              onPress={() => {
                clearError();
                setConfirmingDisable(true);
              }}
            />
          )
        ) : (
          <>
            <Button label={copy.turnOnAction} onPress={enableTracking} />
            {entries.length > 0 ? (
              <Caption color="plum">{copy.disableKeepNote}</Caption>
            ) : null}
          </>
        )}

        {/* A failed "delete all" keeps every date; this is the gentle notice. */}
        {error && confirmingDisable ? (
          <ErrorState
            title={copy.clearErrorTitle}
            message={copy.clearErrorBody}
            retryLabel={copy.retry}
            onRetry={clearError}
          />
        ) : null}
      </View>

      {trackingOn ? (
        <>
          {/* Add form (hidden while editing an existing date). */}
          {editingEntry ? null : (
            <View style={{ gap: spacing.md }}>
              <SectionTitle>{copy.formAddTitle}</SectionTitle>
              <CycleStartForm submitting={submitting} onSubmit={handleAdd} />
            </View>
          )}

          {/* A failed save keeps the form's value; gentle, retryable notice. */}
          {error && !isLoadError && !confirmingDisable ? (
            <ErrorState
              title={copy.saveErrorTitle}
              message={copy.saveErrorBody}
              retryLabel={copy.retry}
              onRetry={clearError}
            />
          ) : null}

          {/* Edit form for a selected date. */}
          {editingEntry ? (
            <View style={{ gap: spacing.md }}>
              <SectionTitle>{copy.formEditTitle}</SectionTitle>
              <CycleStartForm
                entry={editingEntry}
                submitting={submitting}
                onSubmit={handleUpdate}
                onCancel={() => setEditingId(null)}
              />
            </View>
          ) : null}

          {/* Non-diagnostic, explicitly-uncertain insight. */}
          <CycleInsightCard insight={insight} />

          {/* List of start dates. */}
          <View style={{ gap: spacing.md }}>
            <SectionTitle>{copy.listTitle}</SectionTitle>

            {isLoading && entries.length === 0 ? (
              <Caption
                color="plum"
                accessibilityLabel={copy.loadingLabel}
                accessibilityRole="progressbar"
              >
                {copy.loadingLabel}
              </Caption>
            ) : null}

            {isLoadError ? (
              <ErrorState
                title={copy.loadErrorTitle}
                message={copy.loadErrorBody}
                retryLabel={copy.retry}
                onRetry={() => void load(resolveClient())}
              />
            ) : null}

            {!isLoading && !isLoadError && entries.length === 0 ? (
              <EmptyState
                title={copy.emptyTitle}
                body={copy.emptyBody}
                illustration="moon"
              />
            ) : null}

            {entries.map((entry) => (
              <CycleStartRow
                key={entry.id}
                entry={entry}
                confirmingDelete={pendingDeleteId === entry.id}
                disabled={editingId !== null}
                onEdit={() => {
                  clearError();
                  setEditingId(entry.id);
                }}
                onAskDelete={() => setPendingDeleteId(entry.id)}
                onCancelDelete={() => setPendingDeleteId(null)}
                onConfirmDelete={() => void handleDelete(entry.id)}
              />
            ))}
          </View>
        </>
      ) : null}
    </View>
  );
}

interface CycleStartRowProps {
  entry: CycleStart;
  confirmingDelete: boolean;
  disabled: boolean;
  onEdit: () => void;
  onAskDelete: () => void;
  onCancelDelete: () => void;
  onConfirmDelete: () => void;
}

function CycleStartRow({
  entry,
  confirmingDelete,
  disabled,
  onEdit,
  onAskDelete,
  onCancelDelete,
  onConfirmDelete,
}: CycleStartRowProps) {
  return (
    <Card>
      <View style={{ gap: spacing.sm }}>
        <SectionTitle>{formatDate(entry.started_on)}</SectionTitle>

        {confirmingDelete ? (
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
                  onPress={onConfirmDelete}
                />
              </View>
              <View style={{ flexGrow: 1 }}>
                <Button
                  label={copy.deleteCancel}
                  variant="ghost"
                  onPress={onCancelDelete}
                />
              </View>
            </View>
          </View>
        ) : (
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            <View style={{ flexGrow: 1 }}>
              <Button
                label={copy.editAction}
                variant="ghost"
                onPress={onEdit}
                disabled={disabled}
              />
            </View>
            <View style={{ flexGrow: 1 }}>
              <Button
                label={copy.deleteAction}
                variant="ghost"
                onPress={onAskDelete}
                disabled={disabled}
              />
            </View>
          </View>
        )}
      </View>
    </Card>
  );
}

export default CycleScreen;
