import baseConfig from '../../eslint.config';
import { defineConfig } from 'eslint/config';

export default defineConfig([
  ...baseConfig,

  {
    rules: {
      'no-restricted-syntax': 'off',
    },
  },
]);
