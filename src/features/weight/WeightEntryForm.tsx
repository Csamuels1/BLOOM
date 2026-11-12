import { useState } from 'react';
import { View } from 'react-native';

import { Button, Caption, TextField } from '@/components';
import { weightCopy as copy } from '@/content/weight';
import { spacing } from '@/design/tokens';

import {
  localDateString,
  validateWeightKg,
  type WeightEntry,
} from './weightService';
import { kgToDisplay, parseToKg, type UnitSystem } from './units';

/** Values the form hands back once validated: canonical kg plus date and note. */
export interface WeightFormValues {
  weightKg: number;
  measuredAt: string;
  note: string | null;
}

export interface WeightEntryFormProps {
  unitSystem: UnitSystem;
  /** When present, the form edits this entry (pre-filled); otherwise it adds. */
  entry?: WeightEntry;
  /** True while a save is in flight (disables the submit control). */
  submitting?: boolean;
  /**
   * Called with validated values. The parent persists them; if the save fails
   * it leaves the form mounted and the user's values stay exactly as typed —
   * nothing is cleared here on the parent's behalf.
   */
  onSubmit: (values: WeightFormValues) => void;
  /** Optional cancel affordance (shown while editing). */
  onCancel?: () => void;
}

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/** A valid calendar date in YYYY-MM-DD form (rejects e.g. 2026-13-40). */
function isValidDate(value: string): boolean {
  if (!DATE_PATTERN.test(value)) {
    return false;
  }
  const date = new Date(`${value}T00:00:00`);
  return !Number.isNaN(date.getTime()) && localDateString(date) === value;
}

/**
 * Add / edit form for a weight entry (issue #25). Unit-aware: the user types in
 * their preferred unit (kg or lb) and we convert to canonical kilograms on
 * submit. Inputs are labeled, errors are announced, and crucially the form owns
 * its own text state — a failed save upstream never clears it.
 */
export function WeightEntryForm({
  unitSystem,
  entry,
  submitting = false,
  onSubmit,
  onCancel,
}: WeightEntryFormProps) {
  const initialWeight = entry
    ? `${kgToDisplay(entry.weight_kg, unitSystem)}`
    : '';
  const [weight, setWeight] = useState(initialWeight);
  const [date, setDate] = useState(entry?.measured_at ?? localDateString());
  const [note, setNote] = useState(entry?.note ?? '');
  const [weightError, setWeightError] = useState<string | undefined>();
  const [dateError, setDateError] = useState<string | undefined>();

  const isEditing = entry !== undefined;

  function handleSubmit() {
    const weightKg = parseToKg(weight, unitSystem);
    const nextWeightError =
      weightKg === null
        ? copy.weightRequired
        : (validateWeightKg(weightKg) ?? undefined);
    const nextDateError = isValidDate(date) ? undefined : copy.dateInvalid;

    setWeightError(nextWeightError ?? undefined);
    setDateError(nextDateError);

    if (weightKg === null || nextWeightError || nextDateError) {
      return;
    }

    onSubmit({
      weightKg,
      measuredAt: date,
      note: note.trim() === '' ? null : note.trim(),
    });
  }

  const weightHint =
    unitSystem === 'imperial' ? copy.weightHintImperial : copy.weightHintMetric;

  return (
    <View style={{ gap: spacing.md }}>
      <TextField
        label={copy.weightLabel}
        hint={weightHint}
        value={weight}
        onChangeText={(text) => {
          setWeight(text);
          if (weightError) setWeightError(undefined);
        }}
        keyboardType="decimal-pad"
        inputMode="decimal"
        error={weightError}
      />
      <TextField
        label={copy.dateLabel}
        hint={copy.dateHint}
        value={date}
        onChangeText={(text) => {
          setDate(text);
          if (dateError) setDateError(undefined);
        }}
        autoCapitalize="none"
        autoCorrect={false}
        error={dateError}
      />
      <TextField
        label={copy.noteLabel}
        hint={copy.noteHint}
        value={note}
        onChangeText={setNote}
        multiline
      />

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
        <View style={{ flexGrow: 1, flexBasis: 160 }}>
          <Button
            label={isEditing ? copy.saveEdit : copy.saveAdd}
            onPress={handleSubmit}
            loading={submitting}
          />
        </View>
        {onCancel ? (
          <View style={{ flexGrow: 1, flexBasis: 120 }}>
            <Button
              label={copy.cancelEdit}
              variant="ghost"
              onPress={onCancel}
              disabled={submitting}
            />
          </View>
        ) : null}
      </View>

      {submitting ? (
        <Caption color="plum" accessibilityLiveRegion="polite" role="status">
          {copy.saving}
        </Caption>
      ) : null}
    </View>
  );
}

export default WeightEntryForm;
