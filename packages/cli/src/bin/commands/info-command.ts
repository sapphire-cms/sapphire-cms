import { Command } from '@commander-js/extra-typings';
import { Cmd } from '../../common';
import { Args, cmsExecutor } from '../executors';
import { CliCommand } from './cli-command';

export const InfoCommand: CliCommand = (program: Command, invocationDir: string) => {
  program
    .command('info')
    .alias('i')
    .description('Print public information about configuration of CMS.')
    .action(async () => {
      const cliArgs: Args = {
        cmd: Cmd.info_show,
      };

      await cmsExecutor(invocationDir, cliArgs);
    });
};
