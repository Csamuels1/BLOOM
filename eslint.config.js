const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  // Deno Edge Function entrypoints use Deno globals and URL imports; their
  // testable logic lives in sibling logic.ts modules, which ARE linted.
  {
    ignores: [
      'dist/**',
      'coverage/**',
      '.expo/**',
      'supabase/functions/**/index.ts',
    ],
  },
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
