import { useState } from 'react';
import { View } from 'react-native';

import { Button, Caption, TextField } from '@/components';
import { cycleCopy as copy } from '@/content/cycle';
import { spacing } from '@/design/tokens';

import {
  isValidDateString,
  localDateString,
  type CycleStart,
} from './cycleService';

export interface CycleStartFormProps {
  /** When present, the form edits this date (pre-filled); otherwise it adds. */
  entry?: CycleStart;
  /** True while a save is in flight (disables the submit control). */
  submitting?: boolean;
  /**
   * Called with a validated YYYY-MM-DD start date. The parent persists it; if
   * the save fails it leaves the form mounted and the user's value stays exactly
   * as typed — nothing is cleared here on the parent's behalf.
   */
  onSubmit: (startedOn: string) => void;
  /** Optional cancel affordance (shown while editing). */
  onCancel?: () => void;
}

/**
 * Add / edit form for a single cycle start date (issue #34). The field owns its
 * own text state, so a failed save upstream never clears it. The input is
 * labeled and errors are announced.
 */
export function CycleStartForm({
  entry,
  submitting = false,
  onSubmit,
  onCancel,
}: CycleStartFormProps) {
  const [date, setDate] = useState(entry?.started_on ?? localDateString());
  const [dateError, setDateError] = useState<string | undefined>();

  const isEditing = entry !== undefined;

  function handleSubmit() {
    if (!isValidDateString(date)) {
      setDateError(copy.dateInvalid);
      return;
    }
    setDateError(undefined);
    onSubmit(date);
  }

  return (
    <View style={{ gap: spacing.md }}>
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

export default CycleStartForm;
