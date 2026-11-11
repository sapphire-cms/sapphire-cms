import { Command } from '@commander-js/extra-typings';
import { CommandOptions, Cmd } from '../../common';
import { Args, cmsExecutor } from '../executors';
import { CliCommand } from './cli-command';

export const BackupCommand: CliCommand = (main: Command, invocationDir: string) => {
  main
    .command('backup')
    .description('Start the task that copy all content from persistence engine to backup engine.')
    .action(async (_opts: object, command: Command) => {
      const commandOptions: CommandOptions = command.optsWithGlobals() as CommandOptions;

      const cliArgs: Args = {
        cmd: Cmd.cms_backup,
        credential: commandOptions.credential,
      };

      // Kill signals will be handled by child process
      process.on('SIGINT', () => {});
      process.on('SIGTERM', () => {});

      await cmsExecutor(invocationDir, cliArgs, commandOptions.profile);
    });
};
