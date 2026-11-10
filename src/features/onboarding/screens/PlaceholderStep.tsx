import { View } from 'react-native';

import { Body, PageTitle } from '@/components';
import { onboardingCopy as copy } from '@/content/onboarding';
import { spacing } from '@/design/tokens';

/**
 * Interim content for steps whose screens are not built yet (#14, #15). Keeps
 * the flow navigable — the host still shows Back — without a crash. Removed as
 * each real step screen lands.
 */
export function PlaceholderStep() {
  return (
    <View style={{ gap: spacing.lg }}>
      <PageTitle>{copy.placeholderHeading}</PageTitle>
      <Body>{copy.placeholderBody}</Body>
    </View>
  );
}

export default PlaceholderStep;
