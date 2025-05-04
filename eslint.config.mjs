import {defineConfig, globalIgnores} from 'eslint/config';
import {fixupConfigRules, fixupPluginRules} from '@eslint/compat';
import typescriptEslint from '@typescript-eslint/eslint-plugin';
import _import from 'eslint-plugin-import';
import globals from 'globals';
import tsParser from '@typescript-eslint/parser';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import js from '@eslint/js';
import {FlatCompat} from '@eslint/eslintrc';
import boundaries from 'eslint-plugin-boundaries';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all
});

export default defineConfig([globalIgnores(['**/dist/', '**/build/', '**/node_modules/']), {
  extends: fixupConfigRules(compat.extends(
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:import/errors',
    'plugin:import/warnings',
    'plugin:import/typescript',
    'plugin:neverthrow/recommended',
  )),

  plugins: {
    '@typescript-eslint': fixupPluginRules(typescriptEslint),
    import: fixupPluginRules(_import),
    boundaries,
  },

  languageOptions: {
    globals: {
      ...globals.node,
    },

    parser: tsParser,
    ecmaVersion: 5,
    sourceType: 'module',

    parserOptions: {
      project: ['./tsconfig.json'],
    },
  },

  rules: {
    '@typescript-eslint/explicit-module-boundary-types': 'error',
    '@typescript-eslint/no-explicit-any': 'error',

    '@typescript-eslint/no-unused-vars': ['error', {
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_',
    }],

    '@typescript-eslint/explicit-member-accessibility': ['error', {
      accessibility: 'explicit',
      overrides: {
        constructors: 'no-public',
      },
    }],

    '@typescript-eslint/member-ordering': [
      'error',
      {
        'default': [
          'signature',
          'public-static-field',
          'protected-static-field',
          'private-static-field',
          'instance-field',
          'public-static-method',
          'constructor',
          'public-instance-method',
          'protected-instance-method',
          'private-instance-method',
          'private-static-method',
        ]
      }
    ],

    '@typescript-eslint/prefer-readonly': 'error',

    'no-irregular-whitespace': 'error',
    'no-multiple-empty-lines': 'error',

    'import/order': ['error', {
      groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],

      alphabetize: {
        order: 'asc',
        caseInsensitive: true,
      },
    }],

    'boundaries/no-private': ['error', {
      allowUncles: false,
    }],

    'neverthrow/must-use-result': 'warn',
  },
}]);
