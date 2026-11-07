import { fireEvent, render, screen } from '@testing-library/react-native';

import { Button } from '@/components/Button';
import { minTouchTarget } from '@/design/tokens';

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
});
