import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import reactHooks from 'eslint-plugin-react-hooks'; // 👈 1. Add this import

export default [
  {
    ignores: [
      '.next/**',
      'coverage/**',
      'next-env.d.ts',
      '**/firebase-functions-sync-prisma/**',
      '**/firebase-functions-sync-ts-backup/**',
      '**/firebase-functions-sync-ts/**',
      '**/linkFBtoMDB/**',
      'fix.js',
    ],
  },
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: tsParser,
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      'react-hooks': reactHooks, // 👈 2. Add the plugin here
    },
    rules: {
      '@typescript-eslint/no-unused-vars': 'off',
      'no-empty': 'off',
      'react-hooks/exhaustive-deps': 'off', // 👈 3. Turn it off completely
    },
  },
];
