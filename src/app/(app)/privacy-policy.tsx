import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, spacing } from '@/design/tokens';
import { LegalPlaceholderScreen } from '@/features/settings';

/**
 * Privacy policy route (issue #52). A clearly marked placeholder: the final
 * policy is provided by the owner before launch.
 */
export default function PrivacyPolicyRoute() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.ivory }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View
          style={{
            flex: 1,
            padding: spacing.xl,
            maxWidth: 560,
            width: '100%',
            alignSelf: 'center',
          }}
        >
          <LegalPlaceholderScreen kind="privacy" />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
