import { fireEvent, render, screen } from '@testing-library/react-native';

import { Pill } from '@/components/Pill';

describe('Pill', () => {
  it('reflects its selected state to assistive tech', () => {
    render(<Pill label="Gentle loss" selected onPress={() => {}} />);
    const pill = screen.getByRole('button', { name: 'Gentle loss' });
    expect(pill.props.accessibilityState).toMatchObject({ selected: true });
  });

  it('is unselected by default', () => {
    render(<Pill label="Maintain" onPress={() => {}} />);
    const pill = screen.getByRole('button', { name: 'Maintain' });
    expect(pill.props.accessibilityState).toMatchObject({ selected: false });
  });

  it('calls onPress when enabled and not when disabled', () => {
    const onPress = jest.fn();
    const { rerender } = render(<Pill label="Gain" onPress={onPress} />);
    fireEvent.press(screen.getByRole('button', { name: 'Gain' }));
    expect(onPress).toHaveBeenCalledTimes(1);

    rerender(<Pill label="Gain" disabled onPress={onPress} />);
    fireEvent.press(screen.getByRole('button', { name: 'Gain' }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
