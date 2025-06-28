import { Command } from '@commander-js/extra-typings';
import { CliCommand } from './cli-command';

export const ShaperCommand: CliCommand = (program: Command, _invocationDir: string) => {
  const shaperCmd = program.command('shaper').alias('shr').description('Manage content shapers.');

  shaperCmd
    .command('list')
    .alias('ls')
    .description('List existing content shapers.')
    .action(() => {
      console.warn('Not implemented yet.');
    });

  shaperCmd
    .command('create')
    .alias('c')
    .description('Create a new content shaper.')
    .argument('<name>', 'Content Shaper name')
    .action(() => {
      console.warn('Not implemented yet.');
    });

  shaperCmd
    .command('edit')
    .alias('e')
    .description('Edit the content shaper.')
    .argument('<name>', 'Content Shaper name')
    .action(() => {
      console.warn('Not implemented yet.');
    });

  shaperCmd
    .command('delete')
    .alias('rm')
    .description('Delete the content shaper.')
    .argument('<name>', 'Content Shaper name')
    .action(() => {
      console.warn('Not implemented yet.');
    });
};
