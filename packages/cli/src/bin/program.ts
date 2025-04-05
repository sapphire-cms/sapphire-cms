import {Command, Option} from '@commander-js/extra-typings';
import chalk from 'chalk';
import * as packageJson from '../../package.json';
import {Cmd} from '../common';

export type Args = {
  cmd: string;
  args: string[];
  opts: any;
}

export function createProgram(onParse: (args: Args) => void): Command {
  const program = new Command()
      .name('sapphire-cms')
      .alias('scms')
      .description('Sapphire CMS command-line manager and content editor.')
      .version(packageJson.version);

  program.command(Cmd.package)
      .description('Install or remove Sapphire CMS packages.')
      .argument('<packages...>', 'List of package names (without "@sapphire-cms/"). Example: "github"')
      .addOption(new Option('-i, --install',
          'To install requested packages.')
          .conflicts([ 'remove' ]))
      .addOption(new Option('-r, --remove',
          'To remove requested packages.')
          .conflicts([ 'install' ]))
      .action((packages, options: any) => {
        if (!options.install && !options.remove) {
          console.error(chalk.red('You must provide either --install or --remove'));
          process.exit(1);
        }

        onParse({
          cmd: Cmd.package,
          args: packages,
          opts: options,
        });
      });

  return program;
}
