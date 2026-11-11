import { Command } from '@commander-js/extra-typings';
import { Cmd, CommandOptions } from '../../common';
import { Args, cmsExecutor } from '../executors';
import { CliCommand } from './cli-command';

export const InfoCommand: CliCommand = (program: Command, invocationDir: string) => {
  program
    .command('info')
    .alias('i')
    .description('Print public information about configuration of CMS.')
    .action(async (_opts: object, command: Command) => {
      const commandOptions: CommandOptions = command.optsWithGlobals() as CommandOptions;

      const cliArgs: Args = {
        cmd: Cmd.info_show,
      };

      await cmsExecutor(invocationDir, cliArgs, commandOptions.profile);
    });
};
