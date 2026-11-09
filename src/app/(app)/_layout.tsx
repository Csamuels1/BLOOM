import { Stack } from 'expo-router';

/** Protected, post-authentication screens (issue #9). */
export default function AppLayout() {
  return <Stack screenOptions={{ headerShown: false, animation: 'none' }} />;
}
