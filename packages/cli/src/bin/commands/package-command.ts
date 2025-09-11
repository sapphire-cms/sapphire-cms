import { Command } from '@commander-js/extra-typings';
import { CliOptions, Cmd } from '../../common';
import { Args, cmsExecutor } from '../executors';
import { CliCommand } from './cli-command';

export const PackageCommand: CliCommand = (program: Command, invocationDir: string) => {
  const packageCmd = program
    .command('package')
    .alias('pkg')
    .description('Install or remove Sapphire CMS packages.');

  packageCmd
    .command('install')
    .alias('i')
    .description('Install requested packages.')
    .argument(
      '<packages...>',
      'List of package names (without "@sapphire-cms/"). Example: "github"',
    )
    .action(async (packages: string[], _opts: object, command: Command<[string[]]>) => {
      const cliArgs: Args = {
        cmd: Cmd.package_install,
        args: packages,
        credential: (command.optsWithGlobals() as CliOptions).credential,
      };

      await cmsExecutor(invocationDir, cliArgs);
    });

  packageCmd
    .command('remove')
    .alias('rm')
    .description('Remove requested packages.')
    .argument(
      '<packages...>',
      'List of package names (without "@sapphire-cms/"). Example: "github"',
    )
    .action(async (packages: string[], _opts: object, command: Command<[string[]]>) => {
      const cliArgs: Args = {
        cmd: Cmd.package_remove,
        args: packages,
        credential: (command.optsWithGlobals() as CliOptions).credential,
      };

      await cmsExecutor(invocationDir, cliArgs);
    });
};
