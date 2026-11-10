import { expect, test } from 'vitest';
import { CmsConfig, deepClone, overloadCmsConfig } from '../../src';

test('overloadCmsConfig', () => {
  const baseConfig: CmsConfig = {
    config: {
      debug: false,
      modules: [
        {
          module: 'cli',
          config: {
            editor: 'gedit',
          },
        },
        {
          module: 'node',
          config: {
            dataDir: './sapphire-cms-data',
            outputDir: './src/app/generated/cms',
          },
        },
      ],
    },
    layers: {
      bootstrap: '@node',
      persistence: '@node',
      backup: '@github',
      admin: '@rest',
      management: '@rest',
      platform: '@node',
      security: '@simple-auth',
      public: '@rest',
      media: '@cloudinary',
    },
  };

  const overloadConfig: CmsConfig = {
    profile: 'prod',
    extends: './sapphire-cms.config.yaml',
    config: {
      debug: true,
      modules: [
        {
          module: 'cli',
          config: {
            editor: 'vim',
          },
        },
        {
          module: 'firebase',
          config: {
            databaseId: 'sapphire-cms',
          },
        },
      ],
    },
    layers: {
      persistence: '@firebase',
      platform: '@firebase',
    },
  };

  const expected: CmsConfig = {
    profile: 'prod',
    config: {
      debug: true,
      modules: [
        {
          module: 'cli',
          config: {
            editor: 'vim',
          },
        },
        {
          module: 'node',
          config: {
            dataDir: './sapphire-cms-data',
            outputDir: './src/app/generated/cms',
          },
        },
        {
          module: 'firebase',
          config: {
            databaseId: 'sapphire-cms',
          },
        },
      ],
    },
    layers: {
      bootstrap: '@node',
      persistence: '@firebase',
      backup: '@github',
      admin: '@rest',
      management: '@rest',
      platform: '@firebase',
      security: '@simple-auth',
      public: '@rest',
      media: '@cloudinary',
    },
  };

  const result = overloadCmsConfig(baseConfig, overloadConfig);

  const resultExcludingModules = deepClone(result);
  resultExcludingModules.config.modules = [];

  const expectedExcludingModules = deepClone(expected);
  expectedExcludingModules.config.modules = [];

  expect(resultExcludingModules).toEqual(expectedExcludingModules);
  expect(result.config.modules).toHaveLength(expected.config.modules.length);
  expect(result.config.modules).toEqual(expect.arrayContaining(expected.config.modules));
});
