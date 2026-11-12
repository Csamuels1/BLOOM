import {
  formatWeight,
  kgToDisplay,
  kgToLb,
  lbToKg,
  parseToKg,
  unitLabel,
} from '@/features/weight';

describe('kg <-> lb conversion', () => {
  it('converts kilograms to pounds (1 decimal)', () => {
    expect(kgToLb(0)).toBe(0);
    expect(kgToLb(1)).toBe(2.2);
    expect(kgToLb(68)).toBe(149.9);
    expect(kgToLb(100)).toBe(220.5);
  });

  it('converts pounds to kilograms (2 decimals)', () => {
    expect(lbToKg(0)).toBe(0);
    expect(lbToKg(150)).toBe(68.04);
    expect(lbToKg(220.46)).toBe(100);
  });

  it('round-trips a value back close to the original', () => {
    const kg = 72.5;
    const back = lbToKg(kgToLb(kg));
    expect(Math.abs(back - kg)).toBeLessThan(0.1);
  });
});

describe('kgToDisplay / formatWeight', () => {
  it('shows kilograms in metric and pounds in imperial', () => {
    expect(kgToDisplay(68.25, 'metric')).toBe(68.3);
    expect(kgToDisplay(68, 'imperial')).toBe(149.9);
  });

  it('formats with the correct unit label', () => {
    expect(unitLabel('metric')).toBe('kg');
    expect(unitLabel('imperial')).toBe('lb');
    expect(formatWeight(68, 'metric')).toBe('68 kg');
    expect(formatWeight(68, 'imperial')).toBe('149.9 lb');
  });
});

describe('parseToKg', () => {
  it('parses metric input directly to kilograms', () => {
    expect(parseToKg('68.5', 'metric')).toBe(68.5);
  });

  it('parses imperial input into canonical kilograms', () => {
    expect(parseToKg('150', 'imperial')).toBe(68.04);
  });

  it('accepts a comma decimal separator', () => {
    expect(parseToKg('68,5', 'metric')).toBe(68.5);
  });

  it('returns null for blank, non-numeric, or non-positive input', () => {
    expect(parseToKg('', 'metric')).toBeNull();
    expect(parseToKg('   ', 'metric')).toBeNull();
    expect(parseToKg('abc', 'metric')).toBeNull();
    expect(parseToKg('0', 'metric')).toBeNull();
    expect(parseToKg('-5', 'metric')).toBeNull();
  });
});
