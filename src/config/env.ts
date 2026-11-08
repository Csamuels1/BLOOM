import { z } from 'zod';

/**
 * Public client configuration (issue #8).
 *
 * Only `EXPO_PUBLIC_*` values are read here; Expo inlines them into the client
 * bundle, so they must never hold secrets (see docs/ENVIRONMENTS_AND_SECRETS.md).
 * The Supabase publishable (anon) key is public and protected by row-level
 * security. The service-role key is never read by the client.
 */
export const APP_ENVIRONMENTS = ['local', 'staging', 'production'] as const;
export type AppEnvironment = (typeof APP_ENVIRONMENTS)[number];

const envSchema = z.object({
  EXPO_PUBLIC_APP_ENV: z.enum(APP_ENVIRONMENTS).default('local'),
  EXPO_PUBLIC_SUPABASE_URL: z.url(
    'EXPO_PUBLIC_SUPABASE_URL must be a valid URL',
  ),
  EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z
    .string()
    .min(1, 'EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY is required'),
});

export interface PublicEnv {
  appEnv: AppEnvironment;
  supabaseUrl: string;
  supabasePublishableKey: string;
}

/**
 * Validate a raw environment source into typed public config. Pure and
 * synchronous so it can be unit-tested without the app runtime. Throws a
 * ZodError listing every missing/invalid variable.
 */
export function parseEnv(
  source: Record<string, string | undefined> = process.env,
): PublicEnv {
  const parsed = envSchema.parse({
    EXPO_PUBLIC_APP_ENV: source.EXPO_PUBLIC_APP_ENV,
    EXPO_PUBLIC_SUPABASE_URL: source.EXPO_PUBLIC_SUPABASE_URL,
    EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
      source.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  });

  return {
    appEnv: parsed.EXPO_PUBLIC_APP_ENV,
    supabaseUrl: parsed.EXPO_PUBLIC_SUPABASE_URL,
    supabasePublishableKey: parsed.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  };
}

let cached: PublicEnv | undefined;

/**
 * Cached, validated public config for app use. Throws a clear error at first
 * access if Supabase values are missing (e.g. an unconfigured `.env`), rather
 * than failing later inside the Supabase client.
 */
export function getEnv(): PublicEnv {
  if (!cached) {
    try {
      cached = parseEnv();
    } catch {
      throw new Error(
        'Missing Supabase configuration. Copy .env.example to .env and set ' +
          'EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ' +
          '(see docs/ENVIRONMENTS_AND_SECRETS.md).',
      );
    }
  }
  return cached;
}

/** Test-only: clear the cached config. */
export function resetEnvCache(): void {
  cached = undefined;
}
