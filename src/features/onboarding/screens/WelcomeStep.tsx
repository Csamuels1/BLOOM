import { View } from 'react-native';

import { Body, Button, Display, Typography } from '@/components';
import { onboardingCopy as copy } from '@/content/onboarding';
import { spacing } from '@/design/tokens';

import { useOnboardingStore } from '../onboardingStore';

/** Onboarding welcome: approved brand + tagline, gentle intro (issue #13). */
export function WelcomeStep() {
  const next = useOnboardingStore((state) => state.next);

  return (
    <View style={{ gap: spacing.lg }}>
      <Display>BLOOM</Display>
      <Typography variant="pageTitle">{copy.welcomeTagline}</Typography>
      <Body>{copy.welcomeBody}</Body>
      <Button label={copy.welcomeBegin} onPress={() => next()} />
    </View>
  );
}

export default WelcomeStep;
