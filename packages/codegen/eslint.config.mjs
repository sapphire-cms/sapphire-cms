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
          { from: 'typescript', allow: [ 'utils' ] },
          { from: 'yaml', allow: [ 'utils' ] },
        ],
      }],
    },

    settings: {
      'boundaries/report-message': true,
      'boundaries/elements': [
        { type: 'utils', pattern: 'src/utils' },
        { type: 'typescript', pattern: 'src/typescript' },
        { type: 'yaml', pattern: 'src/yaml' },
      ],
    },
  },
]);
