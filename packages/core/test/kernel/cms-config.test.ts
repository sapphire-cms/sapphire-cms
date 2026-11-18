import { expect, test } from 'vitest';
import { CmsConfig, deepClone, id, module, overloadCmsConfig } from '../../src';

test('overloadCmsConfig', () => {
  const baseConfig: CmsConfig = {
    config: {
      debug: false,
      modules: [
        {
          module: id`cli`,
          config: {
            editor: 'gedit',
          },
        },
        {
          module: id`node`,
          config: {
            dataDir: './sapphire-cms-data',
            outputDir: './src/app/generated/cms',
          },
        },
      ],
    },
    layers: {
      bootstrap: module`@node`,
      persistence: module`@node`,
      backup: module`@github`,
      admin: module`@rest`,
      management: module`@rest`,
      platform: module`@node`,
      security: module`@simple-auth`,
      public: module`@rest`,
      media: module`@cloudinary`,
    },
  };

  const overloadConfig: CmsConfig = {
    profile: id`prod`,
    extends: './sapphire-cms.config.yaml',
    config: {
      debug: true,
      modules: [
        {
          module: id`cli`,
          config: {
            editor: 'vim',
          },
        },
        {
          module: id`firebase`,
          config: {
            databaseId: 'sapphire-cms',
          },
        },
      ],
    },
    layers: {
      persistence: module`@firebase`,
      platform: module`@firebase`,
    },
  };

  const expected: CmsConfig = {
    profile: id`prod`,
    config: {
      debug: true,
      modules: [
        {
          module: id`cli`,
          config: {
            editor: 'vim',
          },
        },
        {
          module: id`node`,
          config: {
            dataDir: './sapphire-cms-data',
            outputDir: './src/app/generated/cms',
          },
        },
        {
          module: id`firebase`,
          config: {
            databaseId: 'sapphire-cms',
          },
        },
      ],
    },
    layers: {
      bootstrap: module`@node`,
      persistence: module`@firebase`,
      backup: module`@github`,
      admin: module`@rest`,
      management: module`@rest`,
      platform: module`@firebase`,
      security: module`@simple-auth`,
      public: module`@rest`,
      media: module`@cloudinary`,
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
