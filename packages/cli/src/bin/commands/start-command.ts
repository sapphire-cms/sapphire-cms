import * as process from 'node:process';
import { Command } from '@commander-js/extra-typings';
import { printError } from '@sapphire-cms/node';
import { CommandOptions } from '../../common';
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
    .action(async (dir, opts, command: Command<[string]>) => {
      const { config, profile } = command.optsWithGlobals() as CommandOptions;

      return startSapphireNode(invocationDir, config as string, profile).match(
        () => {},
        (err) => {
          printError(err);
          process.exit(1);
        },
        (defect) => {
          printError(defect);
          process.exit(1);
        },
      );
    });
};
