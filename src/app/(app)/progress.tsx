import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, spacing } from '@/design/tokens';
import { ProgressScreen } from '@/features/progress';

/**
 * Progress route (issue #26). Reached from the Today screen's "bigger picture"
 * card. The screen owns the weekly-average chart, the matching summary, gentle
 * milestones, and its own loading/empty/error states.
 */
export default function ProgressRoute() {
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
          <ProgressScreen />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
