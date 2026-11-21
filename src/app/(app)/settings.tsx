import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, spacing } from '@/design/tokens';
import { SettingsScreen } from '@/features/settings';

/**
 * Settings hub route (issue #52). Reached from the home account area. Holds the
 * account, notification, privacy (export, deletion, cycle preference, blocks,
 * reports), legal, and help controls.
 */
export default function SettingsRoute() {
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
          <SettingsScreen />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
