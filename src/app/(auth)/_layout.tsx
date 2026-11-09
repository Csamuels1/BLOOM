import { Stack } from 'expo-router';

/** Pre-authentication screens (issue #9). */
export default function AuthLayout() {
  return <Stack screenOptions={{ headerShown: false, animation: 'none' }} />;
}
