import * as process from 'node:process';
import * as path from 'path';
import {
  andFinally,
  AsyncProgram,
  asyncProgram,
  CmsConfig,
  matchError,
  Option,
} from '@sapphire-cms/core';
import {
  FsError,
  getCsmConfigFromDir,
  getInvocationDir,
  rmDirectory,
  writeFileSafeDir,
  YamlParsingError,
} from '@sapphire-cms/node';
// @ts-expect-error cannot be resolved by Typescript but can be solved by Node
// eslint-disable-next-line import/no-unresolved
import spawn from 'nano-spawn';
import { errAsync, okAsync, ResultAsync } from 'neverthrow';
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

await andFinally(
  asyncProgram(
    function* (): AsyncProgram<
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
    },
    (defect) => errAsync(new FsError('Defective sapphire-cli program', defect)),
  ),
  () => rmDirectory(path.dirname(tmpConfigFile), true, true),
).match(
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
);

function loadCmsConfig(
  invocationDir: string,
): ResultAsync<CmsConfig, FsError | YamlParsingError | CmsConfigMissingError> {
  return getCsmConfigFromDir(invocationDir).andThen((optionalConfig) => {
    if (Option.isSome(optionalConfig)) {
      return okAsync(optionalConfig.value);
    } else {
      return errAsync(new CmsConfigMissingError(invocationDir));
    }
  });
}

function startSapphireNode(
  invocationDir: string,
  configFilename: string,
): ResultAsync<void, ProcessError> {
  const sapphireNodePath = path.join(
    invocationDir,
    'node_modules',
    '@sapphire-cms',
    'node',
    'dist',
    'sapphire-node.js',
  );

  return ResultAsync.fromPromise(
    spawn(sapphireNodePath, ['--config', configFilename], {
      cwd: invocationDir,
      stdio: 'inherit',
    }),
    (err) => new ProcessError('Failed to start sapphire-node process', err),
  ).map(() => {});
}
