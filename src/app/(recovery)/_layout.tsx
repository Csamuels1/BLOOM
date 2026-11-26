import { Stack } from 'expo-router';

import { useScreenAnimation } from '@/design/screenTransitions';

/** Password-recovery screens, shown only during a reset (issue #10). */
export default function RecoveryLayout() {
  // Native push transitions; none under Reduce Motion (#149).
  const animation = useScreenAnimation('push');
  return <Stack screenOptions={{ headerShown: false, animation }} />;
}
