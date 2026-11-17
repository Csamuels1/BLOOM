import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, spacing } from '@/design/tokens';
import { BlockedMembersScreen } from '@/features/reporting';

/**
 * Blocked members route (issue #40). Lists the members you've blocked and lets
 * you unblock them. Blocking hides posts in both directions (enforced server-side).
 */
export default function BlockedRoute() {
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
          <BlockedMembersScreen />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
