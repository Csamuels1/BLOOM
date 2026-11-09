import { Stack } from 'expo-router';

/** Password-recovery screens, shown only during a reset (issue #10). */
export default function RecoveryLayout() {
  return <Stack screenOptions={{ headerShown: false, animation: 'none' }} />;
}
