import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, spacing } from '@/design/tokens';
import { SupportScreen } from '@/features/support';

/**
 * Support route (issue #49). Always reachable ("talk to someone"): it shows
 * reviewed regional resources when available and an always-present way to reach
 * out otherwise. Messages are non-diagnostic.
 */
export default function SupportRoute() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.ivory }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View
          style={{
            flex: 1,
            gap: spacing.xl,
            padding: spacing.xl,
            maxWidth: 560,
            width: '100%',
            alignSelf: 'center',
          }}
        >
          <SupportScreen />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
