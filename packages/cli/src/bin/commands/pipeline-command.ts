import { Command } from '@commander-js/extra-typings';
import { CliCommand } from './cli-command';

export const PipelineCommand: CliCommand = (program: Command, _invocationDir: string) => {
  const pipelineCmd = program
    .command('pipeline')
    .alias('pln')
    .description('Manage render pipelines.');

  pipelineCmd
    .command('list')
    .alias('ls')
    .description('List existing render pipelines.')
    .action(() => {
      console.warn('Not implemented yet.');
    });

  pipelineCmd
    .command('create')
    .alias('c')
    .description('Create a new render pipeline.')
    .argument('<name>', 'Render Pipeline name')
    .action(() => {
      console.warn('Not implemented yet.');
    });

  pipelineCmd
    .command('edit')
    .alias('e')
    .description('Edit the render pipeline.')
    .argument('<name>', 'Render Pipeline name')
    .action(() => {
      console.warn('Not implemented yet.');
    });

  pipelineCmd
    .command('delete')
    .alias('rm')
    .description('Delete the render pipeline.')
    .argument('<name>', 'Render Pipeline name')
    .action(() => {
      console.warn('Not implemented yet.');
    });
};
