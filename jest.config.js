const expoPreset = require('jest-expo/jest-preset');

module.exports = {
  preset: 'jest-expo',
  testMatch: ['<rootDir>/tests/**/*.test.[jt]s?(x)'],
  // Parallel-worker worktrees (ADR-0009) are separate checkouts; keep them out
  // of the module map so their package.json/mocks never collide with this one.
  modulePathIgnorePatterns: ['<rootDir>/.claude/'],
  setupFilesAfterEnv: ['<rootDir>/tests/jest-setup.js'],
  clearMocks: true,
  // The patched decoder is ESM; preserve Expo's allowlist and transform it too.
  transformIgnorePatterns: expoPreset.transformIgnorePatterns.map((pattern) =>
    pattern.replace('(?!(.pnpm|', '(?!(decode-uri-component|.pnpm|'),
  ),
  moduleNameMapper: {
    '\\.(css)$': '<rootDir>/tests/style-mock.js',
    '\\.(ttf|otf|woff|woff2|png|jpg|jpeg|gif|webp)$':
      '<rootDir>/tests/asset-mock.js',
  },
};
