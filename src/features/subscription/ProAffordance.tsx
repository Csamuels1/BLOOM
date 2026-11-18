import { router } from 'expo-router';

import { Body, Button, Card, SectionTitle } from '@/components';
import { subscriptionCopy as copy } from '@/content/subscription';

/**
 * A gentle Pro affordance (issues #23, #43). States what Pro adds without
 * pressure, scarcity, or shame, and opens the paywall where plans and prices are
 * shown. Free stays genuinely useful on its own.
 */
export function ProAffordance() {
  return (
    <Card>
      <SectionTitle>{copy.proTitle}</SectionTitle>
      <Body>{copy.proBody}</Body>
      <Button
        label={copy.proCta}
        variant="secondary"
        onPress={() => router.navigate('/paywall')}
      />
    </Card>
  );
}

export default ProAffordance;
