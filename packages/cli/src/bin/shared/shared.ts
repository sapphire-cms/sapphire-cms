import * as path from 'path';
import { CmsConfig, Option, ZCmsConfigSchema } from '@sapphire-cms/core';
import { findYamlFile, FsError, loadYaml, YamlParsingError } from '@sapphire-cms/node';
import { failure, Outcome } from 'defectless';
// @ts-expect-error cannot be resolved by Typescript but can be solved by Node
// eslint-disable-next-line import/no-unresolved
import spawn from 'nano-spawn';
import { CmsConfigMissingError, ProcessError } from '../../common';

export function loadCmsConfig(
  invocationDir: string,
): Outcome<CmsConfig, FsError | YamlParsingError | CmsConfigMissingError> {
  return findYamlFile(path.resolve(invocationDir, 'sapphire-cms.config')).flatMap((foundFile) => {
    if (Option.isSome(foundFile)) {
      return loadYaml(foundFile.value, ZCmsConfigSchema);
    } else {
      return failure(new CmsConfigMissingError(invocationDir));
    }
  });
}

export function startSapphireNode(
  invocationDir: string,
  configFilename: string,
): Outcome<void, ProcessError> {
  const sapphireNodePath = path.join(
    invocationDir,
    'node_modules',
    '@sapphire-cms',
    'node',
    'dist',
    'sapphire-node.js',
  );

  return Outcome.fromSupplier(
    () =>
      spawn(sapphireNodePath, ['--config', configFilename], {
        cwd: invocationDir,
        stdio: 'inherit',
      }),
    (err) => new ProcessError('Failed to start sapphire-node process', err),
  ).map(() => {});
}
