import '../../global.css';

import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { useBrandFonts } from '@/design/fonts';
import { AuthProvider, useAuthStore } from '@/features/auth';

/**
 * Auth-gated navigator (issues #9, #10).
 *
 * Routing is decided by session state, not UI: each group only exists in the
 * navigation tree when its guard holds — `(recovery)` during a password reset,
 * `(app)` while authenticated, `(auth)` otherwise — so a protected route cannot
 * be reached by manipulating screen state or deep links. While fonts load or the
 * session is still being restored, the splash is held.
 */
export function RootNavigator() {
  const status = useAuthStore((state) => state.status);
  const recovering = useAuthStore((state) => state.recovering);
  const fontsLoaded = useBrandFonts();

  if (!fontsLoaded || status === 'loading') {
    return null;
  }

  const isAuthenticated = status === 'authenticated';

  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false, animation: 'none' }}>
        {/* Recovery takes precedence: after a reset link the user must set a new
            password before reaching the app, even though the session is valid. */}
        <Stack.Protected guard={recovering}>
          <Stack.Screen name="(recovery)" />
        </Stack.Protected>
        <Stack.Protected guard={!isAuthenticated && !recovering}>
          <Stack.Screen name="(auth)" />
        </Stack.Protected>
        <Stack.Protected guard={isAuthenticated && !recovering}>
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
