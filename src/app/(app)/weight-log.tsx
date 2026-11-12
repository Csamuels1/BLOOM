import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, spacing } from '@/design/tokens';
import { WeightLogScreen } from '@/features/weight';

/**
 * Weight log route (issue #25). Reached from the Today screen's "Log a weight"
 * quick action. The screen itself owns loading/error/empty states and the
 * add/edit/delete flow; this route just frames it in the app chrome.
 */
export default function WeightLogRoute() {
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
          <WeightLogScreen />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
