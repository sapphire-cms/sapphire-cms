import { expect, test } from 'vitest';
import { _interpolateModulesConfig, CmsLoader, ModulesConfigMap } from '../src';

test('interpolateModulesConfig', () => {
  const env = {
    EDITOR: 'gedit',
    GITHUB_PERSONAL_ACCESS_TOKEN: '123456789',
  };

  const config: ModulesConfigMap = {
    cli: {
      editor: '${env.EDITOR}',
    },
    node: {
      dataDir: './sapphire-cms-data',
      ssl: '${env.SSL}',
    },
    github: {
      owner: 'sapphire-cms',
      repo: 'sapphire-cms-docs',
      branch: 'master',
      personalAccessToken: '${env.GITHUB_PERSONAL_ACCESS_TOKEN}',
    },
  };

  const expected: ModulesConfigMap = {
    cli: {
      editor: 'gedit',
    },
    node: {
      dataDir: './sapphire-cms-data',
      ssl: '',
    },
    github: {
      owner: 'sapphire-cms',
      repo: 'sapphire-cms-docs',
      branch: 'master',
      personalAccessToken: '123456789',
    },
  };

  const result = CmsLoader[_interpolateModulesConfig](config, env);
  expect(result).toEqual(expected);
});
