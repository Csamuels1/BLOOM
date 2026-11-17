import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, spacing } from '@/design/tokens';
import { CommunityFeedScreen } from '@/features/community';

/**
 * Community route (issue #38). Two separate spaces — postpartum recovery and
 * gentle weight care. Reading is free; posting and support are Pro (enforced on
 * the server). Posts appear only after a moderator approves them.
 */
export default function CommunityRoute() {
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
          <CommunityFeedScreen />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
