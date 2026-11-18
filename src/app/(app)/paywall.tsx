import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, spacing } from '@/design/tokens';
import { PaywallScreen } from '@/features/subscription';

/**
 * Pro paywall route (issue #43). Shows store-priced plans with purchase and
 * restore. Entitlement is enforced server-side (#45); this screen only offers
 * the purchase. On web, where native purchasing is unavailable, it explains that
 * Pro is managed from the mobile app.
 */
export default function PaywallRoute() {
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
          <PaywallScreen />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
