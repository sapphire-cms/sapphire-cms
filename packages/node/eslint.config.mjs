import baseConfig from '../../eslint.config.mjs';
import boundaries from 'eslint-plugin-boundaries';
import {defineConfig} from 'eslint/config';

export default defineConfig([
  ...baseConfig,

  {
    plugins: {
      boundaries,
    },

    rules: {
      'boundaries/element-types': ['error', {
        default: 'disallow',
        rules: [
          { from: 'utils', allow: [] },
          { from: 'module', allow: [ 'utils' ] },
          { from: 'bin', allow: [ 'utils', 'module' ] },
        ],
      }],
    },

    settings: {
      'boundaries/report-message': true,
      'boundaries/elements': [
        { type: 'utils', pattern: 'src/utils' },
        { type: 'bin', pattern: 'src/bin' },
        { type: 'module', pattern: 'src/module' },
      ],
    },
  },
]);
