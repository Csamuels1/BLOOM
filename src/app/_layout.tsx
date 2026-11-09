import '../../global.css';

import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { useBrandFonts } from '@/design/fonts';
import { AuthProvider, useAuthStore } from '@/features/auth';

/**
 * Auth-gated navigator (issue #9).
 *
 * Routing is decided by session state, not UI: the `(app)` group only exists in
 * the navigation tree while authenticated and `(auth)` only while not, so a
 * protected route cannot be reached by manipulating screen state or deep links.
 * While fonts load or the session is still being restored, the splash is held.
 */
export function RootNavigator() {
  const status = useAuthStore((state) => state.status);
  const fontsLoaded = useBrandFonts();

  if (!fontsLoaded || status === 'loading') {
    return null;
  }

  const isAuthenticated = status === 'authenticated';

  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false, animation: 'none' }}>
        <Stack.Protected guard={!isAuthenticated}>
          <Stack.Screen name="(auth)" />
        </Stack.Protected>
        <Stack.Protected guard={isAuthenticated}>
          <Stack.Screen name="(app)" />
        </Stack.Protected>
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootNavigator />
    </AuthProvider>
  );
}
