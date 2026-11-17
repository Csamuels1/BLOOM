import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, spacing } from '@/design/tokens';
import { MyReportsScreen } from '@/features/reporting';

/**
 * My reports route (issue #40). Shows the caller's own reports and their status
 * in plain language. No reporter identity is ever exposed to anyone else.
 */
export default function MyReportsRoute() {
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
          <MyReportsScreen />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
