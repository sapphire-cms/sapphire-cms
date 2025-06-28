import { Command } from '@commander-js/extra-typings';
import { Cmd } from '../../common';
import { Args, cmsExecutor } from '../executors';
import { CliCommand } from './cli-command';

export const SchemaCommand: CliCommand = (program: Command, invocationDir: string) => {
  const schemaCmd = program.command('schema').alias('skm').description('Manage content schemas.');

  schemaCmd
    .command('list')
    .alias('ls')
    .description('List existing content schemas.')
    .action(async () => {
      const cliArgs: Args = {
        cmd: Cmd.list_schemas,
      };

      await cmsExecutor(invocationDir, cliArgs);
    });

  schemaCmd
    .command('create')
    .alias('c')
    .description('Create a new content schema.')
    .argument('<name>', 'Content Schema name')
    .action(() => {
      console.warn('Not implemented yet.');
    });

  schemaCmd
    .command('edit')
    .alias('e')
    .description('Edit the content schema.')
    .argument('<name>', 'Content Schema name')
    .action(() => {
      console.warn('Not implemented yet.');
    });

  schemaCmd
    .command('delete')
    .alias('rm')
    .description('Delete the content schema.')
    .argument('<name>', 'Content Schema name')
    .action(() => {
      console.warn('Not implemented yet.');
    });
};
