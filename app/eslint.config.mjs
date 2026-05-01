import eslintjs from '@eslint/js'
import reactNativePlugin from '@react-native/eslint-config'
import { defineConfig } from 'eslint/config'
import simpleImportSort from 'eslint-plugin-simple-import-sort'
import typescriptEslint from 'typescript-eslint'

export default defineConfig([
  // files
  {
    files: ['**/*.js', '**/*.jsx', '**/*.ts', '**/*.tsx'],
  },
  {
    ignores: ['node_modules', 'dist', 'Figma', '**/*.config.js'],
  },
  // typescript-eslint
  // - @eslint/js
  // - typescript-eslint
  eslintjs.configs.recommended,
  typescriptEslint.configs.recommended,
  // @typescript-eslint
  {
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          vars: 'all',
          args: 'all',
          argsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],
    },
  },
  // eslint-plugin-simple-import-sort
  {
    plugins: {
      'simple-import-sort': simpleImportSort,
      'react-native': reactNativePlugin,
    },
    rules: {
      'simple-import-sort/imports': 'error',
      'simple-import-sort/exports': 'error',
    },
  },
  // @react-native/eslint-config
  {
    plugins: {
      'simple-import-sort': simpleImportSort,
    },
  },
])
