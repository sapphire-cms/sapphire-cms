import * as process from 'node:process';
import * as path from 'path';
import { CmsConfig, matchError } from '@sapphire-cms/core';
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

export function cmsExecutor(invocationDir: string, cliArgs: Args): Promise<void> {
  const cliModuleConfig = {
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
    cmsConfig.config.modules.cli ||= {};
    Object.assign(cmsConfig.config.modules.cli, cliModuleConfig);

    cmsConfig.config.modules.node ||= {};
    cmsConfig.config.modules.node.configFile = tmpConfigFile;

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
