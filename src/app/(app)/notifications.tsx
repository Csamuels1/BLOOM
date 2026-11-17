import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, spacing } from '@/design/tokens';
import { NotificationSettings } from '@/features/notifications';

/**
 * Reminder settings route (issue #36). Reached from the home account area. The
 * NotificationSettings screen owns the contextual permission request, schedule
 * configuration, and the clear disable flow; reminder text is non-sensitive by
 * design (no health details on the lock screen).
 */
export default function NotificationsRoute() {
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
          <NotificationSettings />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
