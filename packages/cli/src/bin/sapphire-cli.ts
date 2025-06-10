import * as process from 'node:process';
import * as path from 'path';
import { CmsConfig, matchError, Option, ZCmsConfigSchema } from '@sapphire-cms/core';
import {
  findYamlFile,
  FsError,
  getInvocationDir,
  loadYaml,
  rmDirectory,
  writeFileSafeDir,
  YamlParsingError,
} from '@sapphire-cms/node';
import { failure, Outcome, Program, program } from 'defectless';
// @ts-expect-error cannot be resolved by Typescript but can be solved by Node
// eslint-disable-next-line import/no-unresolved
import spawn from 'nano-spawn';
import { temporaryFile } from 'tempy';
import * as yaml from 'yaml';
import { CmsConfigMissingError, optsToArray, ProcessError } from '../common';
import { Args, createProgram } from './program';

const cliArgs = await new Promise<Args>((resolve) => {
  const program = createProgram(resolve);
  program.parse();
});

const invocationDir = getInvocationDir();
const tmpConfigFile = temporaryFile({ name: 'sapphire-cms.config.yaml' });

await program(function* (): Program<
  void,
  FsError | YamlParsingError | ProcessError | CmsConfigMissingError
> {
  const cmsConfig: CmsConfig = yield loadCmsConfig(invocationDir);

  const cliModuleConfig = {
    cmd: cliArgs.cmd,
    args: cliArgs.args,
    opts: cliArgs.opts ? optsToArray(cliArgs.opts) : [],
  };

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

function loadCmsConfig(
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

function startSapphireNode(
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
