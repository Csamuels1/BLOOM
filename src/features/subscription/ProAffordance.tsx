import { useState } from 'react';

import { Body, Button, Caption, Card, SectionTitle } from '@/components';
import { subscriptionCopy as copy } from '@/content/subscription';

/**
 * A gentle Pro affordance (issue #23). States what Pro adds without pressure,
 * scarcity, or shame. The CTA is honest that Pro is not purchasable yet (Phase
 * 10) rather than pretending — so the action is never silently lost.
 */
export function ProAffordance() {
  const [noted, setNoted] = useState(false);

  return (
    <Card>
      <SectionTitle>{copy.proTitle}</SectionTitle>
      <Body>{copy.proBody}</Body>
      <Button
        label={copy.proCta}
        variant="secondary"
        onPress={() => setNoted(true)}
      />
      {noted ? (
        <Caption accessibilityLiveRegion="polite" role="status">
          {copy.proComingSoon}
        </Caption>
      ) : null}
    </Card>
  );
}

export default ProAffordance;
