import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, spacing } from '@/design/tokens';
import { ModerationQueueScreen } from '@/features/moderation';

/**
 * Staff moderation route (issue #41). The functional queue is web-only: on
 * native this renders a stub pointing to the web dashboard (Metro resolves the
 * platform file). Authorization is enforced server-side — the screen reads
 * nothing and every action is declined for a non-moderator regardless of route
 * access. A slightly wider column than the member screens suits the review work.
 */
export default function ModerationRoute() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.ivory }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View
          style={{
            flex: 1,
            gap: spacing.xl,
            padding: spacing.xl,
            maxWidth: 720,
            width: '100%',
            alignSelf: 'center',
          }}
        >
          <ModerationQueueScreen />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
