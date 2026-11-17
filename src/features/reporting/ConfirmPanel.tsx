import { View } from 'react-native';

import { Body, Button } from '@/components';
import { colors, radii, spacing } from '@/design/tokens';

export interface ConfirmPanelProps {
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  busy?: boolean;
}

/** A calm inline confirmation used by the block / unblock flows. */
export function ConfirmPanel({
  message,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
  busy = false,
}: ConfirmPanelProps) {
  return (
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
      <Body>{message}</Body>
      <View style={{ flexDirection: 'row', gap: spacing.sm }}>
        <View style={{ flexGrow: 1 }}>
          <Button
            label={confirmLabel}
            variant="secondary"
            onPress={onConfirm}
            loading={busy}
            disabled={busy}
          />
        </View>
        <View style={{ flexGrow: 1 }}>
          <Button label={cancelLabel} variant="ghost" onPress={onCancel} />
        </View>
      </View>
    </View>
  );
}

export default ConfirmPanel;
