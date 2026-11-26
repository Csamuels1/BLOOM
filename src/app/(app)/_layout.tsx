import { Stack } from 'expo-router';

import { useScreenAnimation } from '@/design/screenTransitions';
import { useEntitlementSync } from '@/features/subscription';

/**
 * The signed-in area always starts on the tab bar (#149); other screens push
 * over it.
 */
export const unstable_settings = {
  initialRouteName: '(tabs)',
};

/** Protected, post-authentication screens (issue #9). */
export default function AppLayout() {
  // Keep the cached Pro entitlement in step with the signed-in user (#45):
  // load on sign-in, clear on sign-out/account switch.
  useEntitlementSync();
  // Screens opened from the tabs (weight log, support, paywall…) use the
  // native push transition; none under Reduce Motion (#149).
  const animation = useScreenAnimation('push');
  return <Stack screenOptions={{ headerShown: false, animation }} />;
}
