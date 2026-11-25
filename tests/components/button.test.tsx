import { fireEvent, render, screen } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

import { Button } from '@/components/Button';
import { colors, minTouchTarget } from '@/design/tokens';

describe('Button', () => {
  it('exposes its label as an accessible button', () => {
    render(<Button label="Save my plan" onPress={() => {}} />);
    expect(
      screen.getByRole('button', { name: 'Save my plan' }),
    ).toBeOnTheScreen();
  });

  it('calls onPress when enabled', () => {
    const onPress = jest.fn();
    render(<Button label="Continue" onPress={onPress} />);
    fireEvent.press(screen.getByRole('button', { name: 'Continue' }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('does not call onPress when disabled and reports disabled state', () => {
    const onPress = jest.fn();
    render(<Button label="Continue" disabled onPress={onPress} />);
    const button = screen.getByRole('button', { name: 'Continue' });
    fireEvent.press(button);
    expect(onPress).not.toHaveBeenCalled();
    expect(button).toBeDisabled();
  });

  it('reports busy and blocks presses while loading', () => {
    const onPress = jest.fn();
    render(<Button label="Saving" loading onPress={onPress} />);
    const button = screen.getByRole('button', { name: 'Saving' });
    fireEvent.press(button);
    expect(onPress).not.toHaveBeenCalled();
    expect(button.props.accessibilityState).toMatchObject({ busy: true });
  });

  it('meets the minimum touch target', () => {
    render(<Button label="Tap" onPress={() => {}} />);
    const button = screen.getByRole('button', { name: 'Tap' });
    // RN Testing Library resolves the Pressable style function onto the host.
    const raw = button.props.style;
    const flat = Array.isArray(raw) ? Object.assign({}, ...raw.flat()) : raw;
    expect(flat.minHeight).toBe(minTouchTarget);
    expect(flat.minWidth).toBe(minTouchTarget);
  });

  // #146: the fill must be on a plain View, so it renders on Android, where
  // a Pressable style function was not applied (ivory "Sign in" on ivory).
  it.each([
    ['primary', colors.plum],
    ['secondary', 'transparent'],
  ] as const)('draws the %s face on a plain view', (variant, background) => {
    render(<Button label="Sign in" variant={variant} onPress={() => {}} />);
    const button = screen.getByRole('button', { name: 'Sign in' });
    expect(typeof button.props.style).not.toBe('function');
    // Walk up from the label to the first host View that paints a background.
    let node = screen.getByText('Sign in').parent;
    while (node && !StyleSheet.flatten(node.props.style)?.backgroundColor) {
      node = node.parent;
    }
    expect(node).not.toBe(button);
    expect(StyleSheet.flatten(node?.props.style)).toMatchObject({
      backgroundColor: background,
    });
  });
});
