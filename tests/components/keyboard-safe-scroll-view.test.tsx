import { render, screen } from '@testing-library/react-native';
import { KeyboardAvoidingView, ScrollView, Text } from 'react-native';

import { KeyboardSafeScrollView } from '@/components';

// Screen coverage is enforced in tests/toolchain/keyboard-safe-screens.test.cjs.
describe('KeyboardSafeScrollView (#146)', () => {
  it('avoids the keyboard on every platform and lets taps through', () => {
    render(
      <KeyboardSafeScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <Text>Form</Text>
      </KeyboardSafeScrollView>,
    );

    expect(screen.getByText('Form')).toBeOnTheScreen();
    // Android draws edge-to-edge, so the window does not resize for the
    // keyboard. The behavior must not be iOS-only.
    const avoider = screen.UNSAFE_getByType(KeyboardAvoidingView);
    expect(avoider.props.behavior).toBe('padding');
    const scroll = screen.UNSAFE_getByType(ScrollView);
    expect(scroll.props.keyboardShouldPersistTaps).toBe('handled');
    expect(scroll.props.contentContainerStyle).toEqual({ flexGrow: 1 });
  });
});
