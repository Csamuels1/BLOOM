import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

/**
 * Calm haptics (issue #51). A tiny wrapper over expo-haptics that:
 * - no-ops on web (there is no haptic engine to call),
 * - never throws or rejects — a missing engine, a disabled OS setting, or a
 *   native error simply means no buzz,
 * - offers only soft, confirming feedback.
 *
 * Use sparingly, for meaningful confirmations only (a weight entry saved,
 * onboarding finished). Never on errors (no "punishment" buzz), never as a
 * reward loop, and never repeatedly in quick succession.
 */

function run(trigger: () => Promise<void>): void {
  if (Platform.OS === 'web') return;
  try {
    trigger().catch(() => {
      // Haptics are a nicety; failure is silent by design.
    });
  } catch {
    // Synchronous failure (e.g. module unavailable): also silent.
  }
}

/** A light, single tap confirming something was saved. */
export function confirmHaptic(): void {
  run(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light));
}

/** A barely-there tick for a deliberate selection change. */
export function selectionHaptic(): void {
  run(() => Haptics.selectionAsync());
}

export const haptics = {
  confirm: confirmHaptic,
  selection: selectionHaptic,
} as const;
