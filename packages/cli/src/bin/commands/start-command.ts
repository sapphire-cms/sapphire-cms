import * as process from 'node:process';
import * as path from 'path';
import { Command } from '@commander-js/extra-typings';
import { Option } from '@sapphire-cms/core';
import { FsError, resolveYamlFile } from '@sapphire-cms/node';
import { failure, Program, program } from 'defectless';
import { ProcessError } from '../../common';
import { startSapphireNode } from '../shared';
import { CliCommand } from './cli-command';

export const StartCommand: CliCommand = (main: Command, invocationDir: string) => {
  main
    .command('start')
    .description('Launch the CMS locally.')
    .argument(
      '[dir]',
      'Absolute or relative path to the root directory of CMS project. ' +
        'By default it is the folder of script invocation',
      '.',
    )
    .option(
      '-c, --config <file>',
      'Absolute or relative path (to the root) to the configuration file.',
      './sapphire-cms.config.yaml',
    )
    .action(async (dir, opts) => {
      const root = path.resolve(process.cwd(), dir);
      const configFilename = path.resolve(root, opts.config);

      await program(function* (): Program<void, FsError | ProcessError> {
        const configFilenameOption: Option<string> = yield resolveYamlFile(configFilename);

        if (Option.isNone(configFilenameOption)) {
          return failure(new FsError(`Missing CMS config file ${configFilename}`));
        }

        return startSapphireNode(invocationDir, configFilenameOption.value);
      }).match(
        () => {},
        (err) => {
          console.error(err);
          process.exit(1);
        },
        (defect) => {
          console.error(defect);
          process.exit(1);
        },
      );
    });
};
