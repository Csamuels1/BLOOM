import { type ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  ScrollView,
  type ScrollViewProps,
} from 'react-native';

export type KeyboardSafeScrollViewProps = Omit<
  ScrollViewProps,
  'keyboardShouldPersistTaps'
> & {
  children: ReactNode;
};

/**
 * Scroll container for any screen with text input (issue #146).
 *
 * Expo SDK 57 draws Android edge-to-edge, so the window no longer resizes for
 * the soft keyboard. Without padding, the keyboard covered the sign-in button
 * on Android and the screen could not scroll to it. `padding` is used on both
 * platforms. KeyboardAvoidingView only pads by the keyboard's actual overlap
 * with this view, so a device that still resizes the window gets no extra
 * space. Taps reach buttons while the keyboard is open.
 */
export function KeyboardSafeScrollView({
  children,
  ...scrollProps
}: KeyboardSafeScrollViewProps) {
  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
      <ScrollView
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        {...scrollProps}
      >
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

export default KeyboardSafeScrollView;
