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
            { from: 'bin', allow: [] },
            { from: 'adapter', allow: [] },
          ],
        },
      ],
    },

    settings: {
      'boundaries/report-message': true,
      'boundaries/elements': [
        { type: 'bin', pattern: 'src/bin' },
        { type: 'adapter', pattern: 'src/adapter' },
      ],
    },
  },
]);
