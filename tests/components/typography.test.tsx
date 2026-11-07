import { render, screen } from '@testing-library/react-native';

import { Body, Caption, Display, PageTitle } from '@/components/Typography';
import { colors, maxFontSizeMultiplier } from '@/design/tokens';

describe('Typography', () => {
  it('renders titles as accessibility headers', () => {
    render(<Display>A gentle beginning</Display>);
    expect(
      screen.getByRole('header', { name: 'A gentle beginning' }),
    ).toBeOnTheScreen();
  });

  it('supports dynamic type with a bounded multiplier', () => {
    render(<Body>Your body, your pace.</Body>);
    const text = screen.getByText('Your body, your pace.');
    expect(text.props.allowFontScaling).toBe(true);
    expect(text.props.maxFontSizeMultiplier).toBe(maxFontSizeMultiplier);
  });

  it('applies the requested brand color token', () => {
    render(<Caption color="amber">Heads up</Caption>);
    const text = screen.getByText('Heads up');
    const flat = Array.isArray(text.props.style)
      ? Object.assign({}, ...text.props.style.flat())
      : text.props.style;
    expect(flat.color).toBe(colors.amber);
  });

  it('defaults body text to primary plum', () => {
    render(<PageTitle>Today</PageTitle>);
    const text = screen.getByText('Today');
    const flat = Array.isArray(text.props.style)
      ? Object.assign({}, ...text.props.style.flat())
      : text.props.style;
    expect(flat.color).toBe(colors.plum);
  });
});
