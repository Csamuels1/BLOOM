import { Stack } from 'expo-router';

import { useScreenAnimation } from '@/design/screenTransitions';

/**
 * The signed-out group always starts on sign-in (#58). Without an explicit
 * initial route, a cold launch fell back to whichever auth screen came first in
 * file discovery. On iOS that was "Check your email" (verify), found by the
 * first simulator smoke run.
 */
export const unstable_settings = {
  initialRouteName: 'sign-in',
};

/** Pre-authentication screens (issue #9). */
export default function AuthLayout() {
  // Native push transitions; none under Reduce Motion (#149).
  const animation = useScreenAnimation('push');
  return (
    <Stack screenOptions={{ headerShown: false, animation }}>
      <Stack.Screen name="sign-in" />
    </Stack>
  );
}
