import '../../global.css';

import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { useBrandFonts } from '@/design/fonts';

export default function RootLayout() {
  const fontsLoaded = useBrandFonts();

  // Hold the first frame until brand fonts resolve so text does not reflow.
  // While no font files are configured yet (issue #6), this resolves instantly.
  if (!fontsLoaded) {
    return null;
  }

  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false, animation: 'none' }} />
    </>
  );
}
