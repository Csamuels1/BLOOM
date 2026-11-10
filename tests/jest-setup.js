// AsyncStorage has no native module under Jest; use its official in-memory
// mock so modules that import the Supabase client can load (issue #9).
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

// Default device locale for onboarding region/units (issue #15). Tests that
// need a different locale override this with jest.mock in-file.
jest.mock('expo-localization', () => ({
  getLocales: () => [{ regionCode: 'NG', measurementSystem: 'metric' }],
}));

// Deterministic deep-link builder so auth redirect helpers resolve under Jest
// without a native linking module (issue #10).
jest.mock('expo-linking', () => ({
  ...jest.requireActual('expo-linking'),
  createURL: (path) => `bloom://${String(path).replace(/^\/+/, '')}`,
}));

// Treat brand fonts as loaded in tests so the font-gated root layout renders.
// At runtime useBrandFonts resolves once the real faces load; in unit tests we
// assert component behavior, not font loading.
jest.mock('expo-font', () => {
  const actual = jest.requireActual('expo-font');
  return {
    ...actual,
    useFonts: () => [true, null],
    isLoaded: () => true,
    loadAsync: () => Promise.resolve(),
  };
});
