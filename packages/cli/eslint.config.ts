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
            // Bin rules
            { from: 'bin:shared', allow: ['common'] },
            { from: 'bin:executors', allow: ['common', 'bin:shared'] },
            { from: 'bin:commands', allow: ['common', 'bin:shared', 'bin:executors'] },

            { from: 'common', allow: [] },
            { from: 'module', allow: ['common'] },
            { from: 'bin', allow: ['common', 'bin:commands'] },
          ],
        },
      ],
    },

    settings: {
      'boundaries/report-message': true,
      'boundaries/elements': [
        // Bin folders
        { type: 'bin:shared', pattern: 'src/bin/shared' },
        { type: 'bin:executors', pattern: 'src/bin/executors' },
        { type: 'bin:commands', pattern: 'src/bin/commands' },

        { type: 'common', pattern: 'src/common' },
        { type: 'bin', pattern: 'src/bin' },
        { type: 'module', pattern: 'src/module' },
      ],
    },
  },
]);
