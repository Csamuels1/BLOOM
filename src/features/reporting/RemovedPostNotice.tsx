import { View } from 'react-native';

import { Body, Caption, Card, SectionTitle } from '@/components';
import { reportingCopy as copy } from '@/content/reporting';
import { spacing } from '@/design/tokens';

export interface RemovedPostNoticeProps {
  /** Optional: the author's own post text, shown back to them only. */
  excerpt?: string | null;
}

/**
 * Shown to an author in place of their removed post (issue #40). Honest and
 * gentle, and intentionally has NO restore, edit or approve control: authors
 * cannot update removed posts (RLS) and only moderator RPCs can change status.
 */
export function RemovedPostNotice({ excerpt }: RemovedPostNoticeProps) {
  return (
    <Card accessibilityRole="summary">
      <View style={{ gap: spacing.sm }}>
        <SectionTitle>{copy.removedTitle}</SectionTitle>
        <Body>{copy.removedBody}</Body>
        {excerpt ? (
          <Caption color="plum" numberOfLines={3}>
            {excerpt}
          </Caption>
        ) : null}
        <Caption color="plum">{copy.removedFollowUp}</Caption>
      </View>
    </Card>
  );
}

export default RemovedPostNotice;
