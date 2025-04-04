import {Command, Option} from '@commander-js/extra-typings';
import chalk from 'chalk';
import * as packageJson from '../package.json';
import {Cmd} from './cli-admin.layer';

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

        // const packageNames = packages.map(packageName => '@sapphire-cms/' + packageName);
        //
        // if (options.install) {
        //   console.log(chalk.blue('Installing packages: ') + chalk.yellow(packageNames.join(', ')));
        //   await adminLayer.installPackages(packageNames);
        //   console.log(chalk.green('CMS packages successfully installed.'));
        // } else {
        //   console.log(chalk.blue('Removing packages: ') + chalk.yellow(packageNames.join(', ')));
        //   await adminLayer.removePackages(packageNames);
        //   console.log(chalk.green('CMS packages successfully removed.'));
        // }
      });

  return program;
}
