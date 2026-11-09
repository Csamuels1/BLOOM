import { APP_ENVIRONMENTS, parseEnv } from '@/config/env';

const valid: Record<string, string | undefined> = {
  EXPO_PUBLIC_APP_ENV: 'staging',
  EXPO_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
  EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_test_key',
};

describe('public env config', () => {
  it('parses valid public configuration', () => {
    expect(parseEnv(valid)).toEqual({
      appEnv: 'staging',
      supabaseUrl: 'https://example.supabase.co',
      supabasePublishableKey: 'sb_publishable_test_key',
    });
  });

  it('defaults the app environment to local', () => {
    const { EXPO_PUBLIC_APP_ENV: _omit, ...rest } = valid;
    expect(parseEnv(rest).appEnv).toBe('local');
  });

  it('rejects a missing Supabase URL', () => {
    const { EXPO_PUBLIC_SUPABASE_URL: _omit, ...rest } = valid;
    expect(() => parseEnv(rest)).toThrow();
  });

  it('rejects a non-URL Supabase URL', () => {
    expect(() =>
      parseEnv({ ...valid, EXPO_PUBLIC_SUPABASE_URL: 'not-a-url' }),
    ).toThrow();
  });

  it('rejects a missing publishable key', () => {
    const { EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY: _omit, ...rest } = valid;
    expect(() => parseEnv(rest)).toThrow();
  });

  it('rejects an unknown app environment', () => {
    expect(() => parseEnv({ ...valid, EXPO_PUBLIC_APP_ENV: 'prod' })).toThrow();
  });

  it('only allows the three documented environments', () => {
    expect(APP_ENVIRONMENTS).toEqual(['local', 'staging', 'production']);
  });
});
