import { Stack } from 'expo-router';

import { useEntitlementSync } from '@/features/subscription';

/** Protected, post-authentication screens (issue #9). */
export default function AppLayout() {
  // Keep the cached Pro entitlement in step with the signed-in user (#45):
  // load on sign-in, clear on sign-out/account switch.
  useEntitlementSync();
  return <Stack screenOptions={{ headerShown: false, animation: 'none' }} />;
}
