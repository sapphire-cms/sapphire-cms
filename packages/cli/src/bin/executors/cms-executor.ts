import * as process from 'node:process';
import * as path from 'path';
import { CmsConfig, matchError, ModuleConfig, ModulesConfig } from '@sapphire-cms/core';
import { FsError, rmDirectory, writeFileSafeDir, YamlParsingError } from '@sapphire-cms/node';
import { Program, program } from 'defectless';
import { temporaryFile } from 'tempy';
import * as yaml from 'yaml';
import { CliOptions, CmsConfigMissingError, optsToArray, ProcessError } from '../../common';
import { loadCmsConfig, startSapphireNode } from '../shared';

export type Args = {
  cmd: string;
  args?: string[];
  opts?: CliOptions;
};

function findModuleConfig(modulesConfig: ModulesConfig, moduleName: string): ModuleConfig {
  for (const moduleConfig of modulesConfig.modules) {
    if (moduleConfig.module === moduleName) {
      return moduleConfig;
    }
  }

  const newModuleConfig: ModuleConfig = {
    module: moduleName,
    config: {},
  };

  modulesConfig.modules.push(newModuleConfig);

  return newModuleConfig;
}

export function cmsExecutor(invocationDir: string, cliArgs: Args): Promise<void> {
  const cliConfig = {
    cmd: cliArgs.cmd,
    args: cliArgs.args,
    opts: cliArgs.opts ? optsToArray(cliArgs.opts) : [],
  };

  const tmpConfigFile = temporaryFile({ name: 'sapphire-cms.config.yaml' });

  return program(function* (): Program<
    void,
    FsError | YamlParsingError | ProcessError | CmsConfigMissingError
  > {
    const cmsConfig: CmsConfig = yield loadCmsConfig(invocationDir);

    // Replace Admin and Management layers with CLI
    cmsConfig.layers.admin = '@cli';
    cmsConfig.layers.management = '@cli';

    const cliModuleConfig = findModuleConfig(cmsConfig.config, 'cli');
    Object.assign(cliModuleConfig.config, cliConfig);

    const nodeModuleConfig = findModuleConfig(cmsConfig.config, 'node');
    nodeModuleConfig.config.configFile = tmpConfigFile;

    // Write tmp config file
    yield writeFileSafeDir(tmpConfigFile, yaml.stringify(cmsConfig));

    return startSapphireNode(invocationDir, tmpConfigFile);
  })
    .finally(() => rmDirectory(path.dirname(tmpConfigFile), true))
    .match(
      () => {},
      (err) => {
        matchError(err, {
          CmsConfigMissingError: (missingConfigError) => {
            console.warn(missingConfigError.message);
          },
          _: (err) => {
            console.error(err);
            process.exit(1);
          },
        });
      },
      (defect) => {
        console.error(defect);
        process.exit(1);
      },
    );
}
