import { Command } from '@commander-js/extra-typings';
import { CliCommand } from './cli-command';

export const InitCommand: CliCommand = (program: Command, _invocationDir: string) => {
  program
    .command('init')
    .description('Integrate Sapphire CMS into an existing project.')
    .action(() => {
      console.warn('Not implemented yet.');
    });
};
