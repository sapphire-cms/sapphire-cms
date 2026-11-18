import { expect, test } from 'vitest';
import { _interpolateModulesConfig, CmsLoader, id, ModulesConfigMap } from '../src';

test('interpolateModulesConfig', () => {
  const env = {
    EDITOR: 'gedit',
    GITHUB_PERSONAL_ACCESS_TOKEN: '123456789',
  };

  const config: ModulesConfigMap = {
    [id`cli`]: {
      editor: '${env.EDITOR}',
    },
    [id`node`]: {
      dataDir: './sapphire-cms-data',
      ssl: '${env.SSL}',
    },
    [id`github`]: {
      owner: 'sapphire-cms',
      repo: 'sapphire-cms-docs',
      branch: 'master',
      personalAccessToken: '${env.GITHUB_PERSONAL_ACCESS_TOKEN}',
    },
  };

  const expected: ModulesConfigMap = {
    [id`cli`]: {
      editor: 'gedit',
    },
    [id`node`]: {
      dataDir: './sapphire-cms-data',
      ssl: '',
    },
    [id`github`]: {
      owner: 'sapphire-cms',
      repo: 'sapphire-cms-docs',
      branch: 'master',
      personalAccessToken: '123456789',
    },
  };

  const result = CmsLoader[_interpolateModulesConfig](config, env);
  expect(result).toEqual(expected);
});
