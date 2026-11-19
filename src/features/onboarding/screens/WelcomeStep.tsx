import { View } from 'react-native';

import { Body, Button, Display, Illustration, Typography } from '@/components';
import { onboardingCopy as copy } from '@/content/onboarding';
import { spacing } from '@/design/tokens';

import { useOnboardingStore } from '../onboardingStore';

/**
 * Onboarding welcome: approved brand + tagline, gentle intro (issue #13), with
 * a decorative blossom illustration (issue #51, pending owner approval).
 */
export function WelcomeStep() {
  const next = useOnboardingStore((state) => state.next);

  return (
    <View style={{ gap: spacing.lg }}>
      <View style={{ alignItems: 'center' }}>
        <Illustration name="blossom" size={128} />
      </View>
      <Display>BLOOM</Display>
      <Typography variant="pageTitle">{copy.welcomeTagline}</Typography>
      <Body>{copy.welcomeBody}</Body>
      <Button label={copy.welcomeBegin} onPress={() => next()} />
    </View>
  );
}

export default WelcomeStep;
