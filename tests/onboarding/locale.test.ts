import { getLocales } from 'expo-localization';

import { localeDefaults } from '@/features/onboarding/locale';

jest.mock('expo-localization', () => ({ getLocales: jest.fn() }));

const mockedGetLocales = getLocales as jest.MockedFunction<typeof getLocales>;

describe('localeDefaults', () => {
  it('maps a US measurement system to imperial and uppercases the region', () => {
    mockedGetLocales.mockReturnValue([
      { regionCode: 'us', measurementSystem: 'us' },
    ] as unknown as ReturnType<typeof getLocales>);

    expect(localeDefaults()).toEqual({
      countryCode: 'US',
      unitSystem: 'imperial',
    });
  });

  it('defaults to metric for other regions', () => {
    mockedGetLocales.mockReturnValue([
      { regionCode: 'NG', measurementSystem: 'metric' },
    ] as unknown as ReturnType<typeof getLocales>);

    expect(localeDefaults()).toEqual({
      countryCode: 'NG',
      unitSystem: 'metric',
    });
  });

  it('falls back safely when the locale is unavailable', () => {
    mockedGetLocales.mockImplementation(() => {
      throw new Error('no locale');
    });
    expect(localeDefaults()).toEqual({
      countryCode: undefined,
      unitSystem: 'metric',
    });
  });
});
