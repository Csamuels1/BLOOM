import { useEffect } from 'react';
import { View } from 'react-native';

import { Body, Button, PageTitle, SafetyNotice } from '@/components';
import { onboardingCopy as copy } from '@/content/onboarding';
import { spacing } from '@/design/tokens';

import { useOnboardingStore } from '../onboardingStore';

/**
 * Pregnancy care boundary (issue #14). The terminus for a pregnant user: a
 * gentle stop that directs to qualified care and never offers a weight or
 * calorie target (docs/PRODUCT_BRIEF.md non-goal, ADR-0003). The only way
 * onward is Back (host chrome) to change the answer.
 */
export function PregnancyBoundaryStep() {
  const patch = useOnboardingStore((state) => state.patch);
  const back = useOnboardingStore((state) => state.back);

  useEffect(() => {
    patch({ pregnancyBoundaryAcknowledged: true });
  }, [patch]);

  return (
    <View style={{ gap: spacing.lg }}>
      <PageTitle>{copy.boundaryHeading}</PageTitle>
      <Body>{copy.boundaryBody}</Body>
      <SafetyNotice
        title={copy.boundaryHeading}
        message={copy.boundaryResources}
      />
      <Button
        label={copy.boundaryChange}
        variant="secondary"
        onPress={() => back()}
      />
    </View>
  );
}

export default PregnancyBoundaryStep;
