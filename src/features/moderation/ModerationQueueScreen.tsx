import { View } from 'react-native';

import { Body, SectionTitle } from '@/components';
import { moderationCopy } from '@/content/moderation';
import { spacing } from '@/design/tokens';

/**
 * Native stub for the moderation queue (issue #41).
 *
 * The real queue is web-only: Metro resolves `ModerationQueueScreen.web.tsx` for
 * web builds and this file for native, so the moderation data layer
 * (moderationService / moderationStore and its reads and RPC calls) is never
 * bundled into the iOS or Android app. On a device the staff route shows only a
 * pointer to the web dashboard. This file deliberately performs no data access.
 */
export function ModerationQueueScreen() {
  return (
    <View style={{ gap: spacing.md }}>
      <SectionTitle>{moderationCopy.webOnlyTitle}</SectionTitle>
      <Body>{moderationCopy.webOnlyBody}</Body>
    </View>
  );
}

export type ModerationQueueScreenProps = Record<string, never>;
