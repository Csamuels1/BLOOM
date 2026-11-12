import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, spacing } from '@/design/tokens';
import { ProgressPhotosScreen } from '@/features/photos';

/**
 * Private progress photos route (issue #27). Reached from the Today screen. The
 * screen itself owns the optional picker, signed-URL display, and replace/delete
 * flows, all scoped to the signed-in user; this route just frames it.
 */
export default function ProgressPhotosRoute() {
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
          <ProgressPhotosScreen />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
