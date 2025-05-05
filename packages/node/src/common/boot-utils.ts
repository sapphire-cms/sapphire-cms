import * as process from 'node:process';
import * as path from 'path';
import { CmsConfig, Option, ZCmsConfigSchema } from '@sapphire-cms/core';
import { okAsync, ResultAsync } from 'neverthrow';
import { FsError, YamlParsingError } from './errors';
import { findYamlFile, loadYaml } from './yaml-utils';

export function getInvocationDir(): string {
  const args = process.argv.slice(2);
  return args.length === 1 ? path.resolve(args[0]) : process.cwd();
}

// TODO: move to cli as no longer used by node
export function getCsmConfigFromDir(
  invocationDir: string,
): ResultAsync<Option<CmsConfig>, FsError | YamlParsingError> {
  return findYamlFile(path.resolve(invocationDir, 'sapphire-cms.config')).andThen((foundFile) => {
    if (Option.isSome(foundFile)) {
      return loadYaml(foundFile.value, ZCmsConfigSchema).map((configSchema) =>
        Option.some(configSchema),
      );
    } else {
      return okAsync(Option.none());
    }
  });
}
