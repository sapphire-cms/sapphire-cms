import * as process from 'node:process';
import * as path from 'path';
import {
  CmsConfig,
  matchError,
  ModuleConfig,
  ModulesConfig,
  Option,
  ZCmsConfigSchema,
} from '@sapphire-cms/core';
import {
  findYamlFile,
  FsError,
  loadYaml,
  printError,
  rmDirectory,
  writeTextFileSafeDir,
  YamlParsingError,
} from '@sapphire-cms/node';
import { failure, Program, program } from 'defectless';
import { temporaryFile } from 'tempy';
import * as yaml from 'yaml';
import { CliOptions, CmsConfigMissingError, optsToArray, ProcessError } from '../../common';
import { startSapphireNode } from '../shared';

export type Args = {
  cmd: string;
  args?: string[];
  opts?: CliOptions;
  credential?: string;
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
    credential: cliArgs.credential,
  };

  const tmpConfigFile = temporaryFile({ name: 'sapphire-cms.config.yaml' });

  return program(function* (): Program<
    void,
    FsError | YamlParsingError | ProcessError | CmsConfigMissingError
  > {
    // TODO: resolve by profile
    const foundFile: Option<string> = yield findYamlFile(
      path.resolve(invocationDir, 'sapphire-cms.config'),
    );

    if (Option.isNone(foundFile)) {
      return failure(new CmsConfigMissingError(invocationDir));
    }

    const cmsConfigFile = foundFile.value;
    const cmsConfig: CmsConfig = yield loadYaml(cmsConfigFile, ZCmsConfigSchema);

    const cliModuleConfig = findModuleConfig(cmsConfig.config, 'cli');
    Object.assign(cliModuleConfig.config, cliConfig);

    const tmpCmsConfig: CmsConfig = {
      extends: cmsConfigFile,
      config: {
        debug: cmsConfig.config.debug,
        modules: [cliModuleConfig],
      },
      layers: {
        admin: '@cli',
        management: '@cli',
        public: '@default',
      },
    };

    // Write tmp config file
    yield writeTextFileSafeDir(tmpConfigFile, yaml.stringify(tmpCmsConfig));

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
            printError(err);
            process.exit(1);
          },
        });
      },
      (defect) => {
        printError(defect);
        process.exit(1);
      },
    );
}
