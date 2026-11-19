import '../../global.css';

import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { useBrandFonts } from '@/design/fonts';
import { AuthProvider, useAuthStore } from '@/features/auth';
import { installGlobalCrashHandler } from '@/features/telemetry';

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
  // Sanitized, first-party crash reporting (#53). The app's own error handling
  // is unchanged — the previous global handler always still runs.
  useEffect(() => {
    installGlobalCrashHandler();
  }, []);

  return (
    <AuthProvider>
      <RootNavigator />
    </AuthProvider>
  );
}
