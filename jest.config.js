module.exports = {
  preset: 'jest-expo',
  testMatch: ['<rootDir>/tests/**/*.test.[jt]s?(x)'],
  clearMocks: true,
  moduleNameMapper: { '\\.(css)$': '<rootDir>/tests/style-mock.js' },
};
