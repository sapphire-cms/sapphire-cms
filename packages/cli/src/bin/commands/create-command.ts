import { Command } from '@commander-js/extra-typings';
import { CliCommand } from './cli-command';

export const CreateCommand: CliCommand = (program: Command, _invocationDir: string) => {
  program
    .command('create')
    .description('Scaffold a new CMS project from scratch.')
    .action(() => {
      console.warn('Not implemented yet.');
    });
};
