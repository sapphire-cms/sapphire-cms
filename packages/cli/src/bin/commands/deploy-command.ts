import { Command } from '@commander-js/extra-typings';
import { CliCommand } from './cli-command';

export const DeployCommand: CliCommand = (program: Command, _invocationDir: string) => {
  program
    .command('deploy')
    .description('Deploy to the cloud.')
    .action(() => {
      console.warn('Not implemented yet.');
    });
};
