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
            { from: 'kernel', allow: ['common'] },
            { from: 'loadables', allow: ['common', 'kernel', 'model'] },
            { from: 'layers', allow: ['common', 'kernel', 'model'] },
            { from: 'cms-stores', allow: ['common', 'kernel', 'model'] },
            {
              from: 'services',
              allow: ['common', 'kernel', 'model', 'loadables', 'layers', 'cms-stores'],
            },

            // Model rules
            {
              from: 'model',
              allow: ['common', 'kernel', 'model:common', 'model:documents', 'model:schemas'],
            },
            { from: 'model:schemas', allow: ['common', 'kernel', 'model:common'] },
            { from: 'model:documents', allow: ['common', 'kernel', 'model:common'] },
            {
              from: 'model:errors',
              allow: ['common', 'kernel', 'model:common', 'model:documents', 'model:schemas'],
            },
            { from: 'model:common', allow: ['common', 'kernel'] },
            { from: 'model', allow: ['common', 'kernel'] },

            // Layer rules
            { from: 'layer:admin', allow: ['common', 'kernel', 'model'] },
            { from: 'layer:content', allow: ['common', 'kernel', 'model'] },
            { from: 'layer:delivery', allow: ['common', 'kernel', 'model'] },
            { from: 'layer:management', allow: ['common', 'kernel', 'model'] },
            { from: 'layer:media', allow: ['common', 'kernel', 'model'] },
            { from: 'layer:persistence', allow: ['common', 'kernel', 'model'] },
            { from: 'layer:platform', allow: ['common', 'kernel', 'model'] },
            { from: 'layer:render', allow: ['common', 'kernel', 'model'] },
            { from: 'layer:security', allow: ['common', 'kernel', 'model'] },
            { from: 'layer:public', allow: ['common', 'kernel', 'model'] },
            { from: 'layer:shaper', allow: ['common', 'kernel', 'model'] },
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
                'layer:media',
                'layer:persistence',
                'layer:platform',
                'layer:render',
                'layer:security',
                'layer:public',
                'layer:shaper',
              ],
            },
          ],
        },
      ],
    },

    settings: {
      'boundaries/report-message': true,
      'boundaries/elements': [
        // Model folders
        { type: 'model', pattern: 'src/model' },
        { type: 'model:common', pattern: 'src/model/common' },
        { type: 'model:documents', pattern: 'src/model/documents' },
        { type: 'model:errors', pattern: 'src/model/errors' },
        { type: 'model:schemas', pattern: 'src/model/schemas' },

        // Layer folders
        { type: 'layer:admin', pattern: 'src/layers/admin' },
        { type: 'layer:bootstrap', pattern: 'src/layers/bootstrap' },
        { type: 'layer:content', pattern: 'src/layers/content' },
        { type: 'layer:delivery', pattern: 'src/layers/delivery' },
        { type: 'layer:management', pattern: 'src/layers/management' },
        { type: 'layer:media', pattern: 'src/layers/media' },
        { type: 'layer:persistence', pattern: 'src/layers/persistence' },
        { type: 'layer:platform', pattern: 'src/layers/platform' },
        { type: 'layer:render', pattern: 'src/layers/render' },
        { type: 'layer:security', pattern: 'src/layers/security' },
        { type: 'layer:public', pattern: 'src/layers/public' },
        { type: 'layer:shaper', pattern: 'src/layers/shaper' },

        { type: 'common', pattern: 'src/common' },
        { type: 'kernel', pattern: 'src/kernel' },
        { type: 'loadables', pattern: 'src/loadables' },
        { type: 'model', pattern: 'src/model' },
        { type: 'cms-stores', pattern: 'src/cms-stores' },
        { type: 'layers', pattern: 'src/layers' },
        { type: 'services', pattern: 'src/services' },
      ],
    },
  },
]);
