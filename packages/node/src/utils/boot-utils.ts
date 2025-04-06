import * as path from 'path';
import {CmsConfig, ZCmsConfigSchema} from '@sapphire-cms/core';
import {findYamlFile} from './fs-utils';
import {loadYaml} from './yaml-utils';
import * as process from 'node:process';

export function getInvocationDir(): string {
  const args = process.argv.slice(2);
  return args.length === 1
      ? path.resolve(args[0])
      : process.cwd();
}

// TODO: move to cli as no longer used by node
export async function getCsmConfigFromDir(invocationDir: string): Promise<CmsConfig> {
  const csmConfigFile = await findYamlFile(path.resolve(invocationDir, 'sapphire-cms.config'));
  if (!csmConfigFile) {
    throw new Error(`Missing sapphire-cms.config.yaml in ${invocationDir}`);
  }

  return loadYaml(csmConfigFile!, ZCmsConfigSchema);
}
