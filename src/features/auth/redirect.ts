import * as Linking from 'expo-linking';

/**
 * Deep link Supabase should send the user back to from a verification or
 * password-reset email. Built from the app scheme (`bloom`) via expo-linking so
 * it resolves correctly in dev (exp://…/--/path) and in a standalone build
 * (bloom://path). The URL must also be allow-listed in the Supabase project's
 * auth redirect settings.
 */
export function authRedirectTo(path = 'sign-in'): string {
  return Linking.createURL(path);
}
