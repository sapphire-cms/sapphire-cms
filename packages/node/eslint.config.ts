import baseConfig from '../../eslint.config';
import boundaries from 'eslint-plugin-boundaries';
import { defineConfig } from 'eslint/config';

export default defineConfig([
  ...baseConfig,

  {
    plugins: {
      boundaries,
    },

    rules: {
      'boundaries/element-types': [
        'error',
        {
          default: 'disallow',
          rules: [
            { from: 'common', allow: [] },
            { from: 'module', allow: ['common'] },
            { from: 'bin', allow: ['common', 'module'] },
          ],
        },
      ],
    },

    settings: {
      'boundaries/report-message': true,
      'boundaries/elements': [
        { type: 'common', pattern: 'src/common' },
        { type: 'bin', pattern: 'src/bin' },
        { type: 'module', pattern: 'src/module' },
      ],
    },
  },
]);
