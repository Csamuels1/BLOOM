import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Body, Display, PageTitle, Typography } from '@/components';
import { authCopy as copy } from '@/content/auth';
import { colors, spacing } from '@/design/tokens';

/**
 * Pre-authentication landing / sign-in placeholder (issue #9).
 *
 * This is the only route reachable while signed out. The email registration and
 * account-recovery forms are added in issue #10; for now it explains what is
 * coming without collecting any data.
 */
export default function SignInScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.ivory }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            gap: spacing.xl,
            padding: spacing.xl,
            maxWidth: 560,
            width: '100%',
            alignSelf: 'center',
          }}
        >
          <Display>{copy.name}</Display>
          <Typography variant="pageTitle">{copy.tagline}</Typography>
          <Body>{copy.welcome}</Body>
          <PageTitle>{copy.signInHeading}</PageTitle>
          <Body>{copy.signInBody}</Body>
          <Body>{copy.privacyNote}</Body>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
