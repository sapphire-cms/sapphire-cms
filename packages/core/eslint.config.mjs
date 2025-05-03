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
          { from: 'common', allow: [] },
          { from: 'kernel', allow: [ 'common' ] },
          { from: 'loadables', allow: [ 'common', 'model' ] },
          { from: 'layers', allow: [ 'common', 'model' ] },
          { from: 'services', allow: [ 'common', 'kernel', 'model', 'loadables', 'layers' ] },

          // Model rules
          { from: 'model:stores', allow: [ 'common', 'model:common', 'model:schemas' ] },
          { from: 'model:schemas', allow: [ 'common', 'model:common' ] },
          { from: 'model:documents', allow: [ 'common', 'model:common' ] },
          { from: 'model:common', allow: [ 'common' ] },

          // Layer rules
          { from: 'layer:admin', allow: [ 'common', 'kernel', 'model' ] },
          { from: 'layer:content', allow: [ 'common', 'kernel', 'model' ] },
          { from: 'layer:delivery', allow: [ 'common', 'kernel', 'model' ] },
          { from: 'layer:management', allow: [ 'common', 'kernel', 'model' ] },
          { from: 'layer:persistence', allow: [ 'common', 'kernel', 'model' ] },
          { from: 'layer:platform', allow: [ 'common', 'kernel', 'model' ] },
          { from: 'layer:render', allow: [ 'common', 'kernel', 'model' ] },
          {
            from: 'layer:bootstrap',
            allow: [
              'common',
              'kernel',
              'model',
              'loadables',
              'layer:admin',
              'layer:content',
              'layer:delivery',
              'layer:management',
              'layer:persistence',
              'layer:platform',
              'layer:render',
            ],
          },
        ],
      }],
    },

    settings: {
      'boundaries/report-message': true,
      'boundaries/elements': [
        // Model folders
        { type: 'model:common', pattern: 'src/model/common' },
        { type: 'model:schemas', pattern: 'src/model/schemas' },
        { type: 'model:documents', pattern: 'src/model/documents' },
        { type: 'model:stores', pattern: 'src/model/stores' },

        // Layer folders
        { type: 'layer:admin', pattern: 'src/layers/admin' },
        { type: 'layer:bootstrap', pattern: 'src/layers/bootstrap' },
        { type: 'layer:content', pattern: 'src/layers/content' },
        { type: 'layer:delivery', pattern: 'src/layers/delivery' },
        { type: 'layer:management', pattern: 'src/layers/management' },
        { type: 'layer:persistence', pattern: 'src/layers/persistence' },
        { type: 'layer:platform', pattern: 'src/layers/platform' },
        { type: 'layer:render', pattern: 'src/layers/render' },

        { type: 'common', pattern: 'src/common' },
        { type: 'kernel', pattern: 'src/kernel' },
        { type: 'loadables', pattern: 'src/loadables' },
        { type: 'model', pattern: 'src/model' },
        { type: 'layers', pattern: 'src/layers' },
        { type: 'services', pattern: 'src/services' },
      ],
    },
  },
]);
