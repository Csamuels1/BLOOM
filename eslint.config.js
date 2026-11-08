const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  { ignores: ['dist/**', 'coverage/**', '.expo/**'] },
  {
    files: ['scripts/**/*.cjs'],
    languageOptions: {
      globals: {
        __dirname: 'readonly',
        Buffer: 'readonly',
        require: 'readonly',
        module: 'readonly',
        process: 'readonly',
        console: 'readonly',
      },
    },
  },
  {
    files: ['tests/jest-setup.js'],
    languageOptions: {
      globals: { jest: 'readonly', module: 'readonly' },
    },
  },
]);
