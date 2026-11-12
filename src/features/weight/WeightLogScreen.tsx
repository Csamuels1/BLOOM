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
import { weightCopy as copy } from '@/content/weight';
import { colors, radii, spacing } from '@/design/tokens';
import { useProfileStore } from '@/features/profile';
import { getSupabaseClient, type AppSupabaseClient } from '@/lib/supabase';

import { WeightEntryForm, type WeightFormValues } from './WeightEntryForm';
import { formatWeight, type UnitSystem } from './units';
import { type WeightEntry } from './weightService';
import { useWeightStore } from './weightStore';

export interface WeightLogScreenProps {
  /** Injectable for tests; defaults to the app's Supabase client at call time. */
  client?: AppSupabaseClient;
}

/** Narrow the profile's free-form unit_system string to our union (default metric). */
function resolveUnit(unitSystem: string | null | undefined): UnitSystem {
  return unitSystem === 'imperial' ? 'imperial' : 'metric';
}

/** A readable measured-on date, locale-aware, with no timezone shifting. */
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
 * Weight log CRUD screen (issue #25). Kilograms are canonical; the form is
 * unit-aware and reads the user's preference from the profile store. Multiple
 * entries per date are supported. Saving is resilient: on any failure the user's
 * typed values are retained and a gentle, retryable notice appears — input is
 * never discarded.
 */
export function WeightLogScreen({ client }: WeightLogScreenProps) {
  const unitSystem = useProfileStore((state) =>
    resolveUnit(state.profile?.unit_system),
  );

  const entries = useWeightStore((state) => state.entries);
  const status = useWeightStore((state) => state.status);
  const error = useWeightStore((state) => state.error);
  const load = useWeightStore((state) => state.load);
  const add = useWeightStore((state) => state.add);
  const update = useWeightStore((state) => state.update);
  const remove = useWeightStore((state) => state.remove);
  const clearError = useWeightStore((state) => state.clearError);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
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

  async function handleAdd(values: WeightFormValues) {
    setSubmitting(true);
    // On failure the form stays mounted with the user's values intact; the
    // store sets `error`, which renders as a retryable notice below. On success
    // the store prepends the new entry and the list updates.
    await add(resolveClient(), {
      weightKg: values.weightKg,
      measuredAt: values.measuredAt,
      note: values.note,
    });
    setSubmitting(false);
  }

  async function handleUpdate(values: WeightFormValues) {
    if (!editingId) return;
    setSubmitting(true);
    const ok = await update(resolveClient(), editingId, {
      weightKg: values.weightKg,
      measuredAt: values.measuredAt,
      note: values.note,
    });
    setSubmitting(false);
    if (ok) {
      setEditingId(null);
    }
  }

  async function handleDelete(id: string) {
    const ok = await remove(resolveClient(), id);
    if (ok) {
      setPendingDeleteId(null);
    }
  }

  const isLoading = status === 'loading';
  const isLoadError = status === 'error' && entries.length === 0;

  return (
    <View style={{ gap: spacing.xl }}>
      <View style={{ gap: spacing.xs }}>
        <PageTitle>{copy.title}</PageTitle>
        <Body>{copy.intro}</Body>
      </View>

      {/* Add form (hidden while editing an existing entry). */}
      {editingEntry ? null : (
        <View style={{ gap: spacing.md }}>
          <SectionTitle>{copy.formAddTitle}</SectionTitle>
          <WeightEntryForm
            unitSystem={unitSystem}
            submitting={submitting}
            onSubmit={handleAdd}
          />
        </View>
      )}

      {/* A failed save keeps the form's values; this is the gentle retry notice. */}
      {error && !isLoadError ? (
        <ErrorState
          title={copy.saveErrorTitle}
          message={copy.saveErrorBody}
          retryLabel={copy.retry}
          onRetry={clearError}
        />
      ) : null}

      {/* Edit form for a selected entry. */}
      {editingEntry ? (
        <View style={{ gap: spacing.md }}>
          <SectionTitle>{copy.formEditTitle}</SectionTitle>
          <WeightEntryForm
            unitSystem={unitSystem}
            entry={editingEntry}
            submitting={submitting}
            onSubmit={handleUpdate}
            onCancel={() => setEditingId(null)}
          />
        </View>
      ) : null}

      {/* List of entries. */}
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
          <EmptyState title={copy.emptyTitle} body={copy.emptyBody} />
        ) : null}

        {entries.map((entry) => (
          <WeightEntryRow
            key={entry.id}
            entry={entry}
            unitSystem={unitSystem}
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
    </View>
  );
}

interface WeightEntryRowProps {
  entry: WeightEntry;
  unitSystem: UnitSystem;
  confirmingDelete: boolean;
  disabled: boolean;
  onEdit: () => void;
  onAskDelete: () => void;
  onCancelDelete: () => void;
  onConfirmDelete: () => void;
}

function WeightEntryRow({
  entry,
  unitSystem,
  confirmingDelete,
  disabled,
  onEdit,
  onAskDelete,
  onCancelDelete,
  onConfirmDelete,
}: WeightEntryRowProps) {
  return (
    <Card>
      <View style={{ gap: spacing.sm }}>
        <SectionTitle>{formatWeight(entry.weight_kg, unitSystem)}</SectionTitle>
        <Caption color="plum">{formatDate(entry.measured_at)}</Caption>
        {entry.note ? <Body>{entry.note}</Body> : null}

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

export default WeightLogScreen;
