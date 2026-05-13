import { Command } from '@commander-js/extra-typings';
import { CliOptions, Cmd } from '../../common';
import { Args, cmsExecutor } from '../executors';
import { CliCommand } from './cli-command';

export const RestoreCommand: CliCommand = (main: Command, invocationDir: string) => {
  main
    .command('restore')
    .description(
      'Start the task that copy all content from backup engine into main persistence engine.',
    )
    .action(async (_opts: object, command: Command) => {
      const cliArgs: Args = {
        cmd: Cmd.cms_restore,
        credential: (command.optsWithGlobals() as CliOptions).credential,
      };

      // Kill signals will be handled by child process
      process.on('SIGINT', () => {});
      process.on('SIGTERM', () => {});

      await cmsExecutor(invocationDir, cliArgs);
    });
};
