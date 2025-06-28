import { Command } from '@commander-js/extra-typings';
import { CliOptions, Cmd } from '../../common';
import { Args, cmsExecutor } from '../executors';
import { CliCommand } from './cli-command';

export const DocumentCommand: CliCommand = (program: Command, invocationDir: string) => {
  const documentCmd = program
    .command('document')
    .alias('doc')
    .description('Create, edit or delete documents managed by CMS.');

  documentCmd
    .command('list')
    .alias('ls')
    .description('List all documents in the store')
    .argument('<store>', 'Store name')
    .action(async (store, opts: CliOptions) => {
      const cliArgs: Args = {
        cmd: Cmd.document_list,
        args: [store],
        opts,
      };

      await cmsExecutor(invocationDir, cliArgs);
    });

  documentCmd
    .command('print')
    .alias('p')
    .description('Print the content of the document')
    .argument('<store>', 'Store name')
    .option('-p, --path <path>', 'Slash "/" separated path. Only for tree stores.')
    .option('-d, --doc <docId>', 'Document ID')
    .option('-v, --variant <variant>', 'Variant of the document.')
    .action(async (store, opts: CliOptions) => {
      const cliArgs: Args = {
        cmd: Cmd.document_print,
        args: [store],
        opts,
      };

      await cmsExecutor(invocationDir, cliArgs);
    });

  documentCmd
    .command('create')
    .alias('c')
    .description('Create a new document in the store')
    .argument('<store>', 'Store name')
    .option('-p, --path <path>', 'Slash "/" separated path. Only for tree stores.')
    .option('-d, --doc <docId>', 'Document ID')
    .option('-v, --variant <variant>', 'Variant of the document.')
    .option(
      '-e, --editor <editor>',
      'Text editor to use. This option overrides editor in defined in configuration file.',
    )
    .action(async (store, opts: CliOptions) => {
      const cliArgs: Args = {
        cmd: Cmd.document_create,
        args: [store],
        opts,
      };

      await cmsExecutor(invocationDir, cliArgs);
    });

  documentCmd
    .command('edit')
    .alias('e')
    .description('Edit existing document.')
    .argument('<store>', 'Store name')
    .option('-p, --path <path>', 'Slash "/" separated path. Only for tree stores.')
    .option('-d, --doc <docId>', 'Document ID')
    .option('-v, --variant <variant>', 'Variant of the document.')
    .option(
      '-e, --editor <editor>',
      'Text editor to use. This option overrides editor in defined in configuration file.',
    )
    .action(async (store, opts: CliOptions) => {
      const cliArgs: Args = {
        cmd: Cmd.document_edit,
        args: [store],
        opts,
      };

      await cmsExecutor(invocationDir, cliArgs);
    });

  documentCmd
    .command('ref-edit')
    .alias('rfe')
    .description('Edit existing document by provided document reference.')
    .argument('<ref>', 'Document reference')
    .option(
      '-e, --editor <editor>',
      'Text editor to use. This option overrides editor in defined in configuration file.',
    )
    .action(async (ref, opts: CliOptions) => {
      const cliArgs: Args = {
        cmd: Cmd.document_ref_edit,
        args: [ref],
        opts,
      };

      await cmsExecutor(invocationDir, cliArgs);
    });

  documentCmd
    .command('delete')
    .alias('rm')
    .description('Delete existing document.')
    .argument('<store>', 'Store name')
    .option('-p, --path <path>', 'Slash "/" separated path. Only for tree stores.')
    .option('-d, --doc <docId>', 'Document ID')
    .option('-v, --variant <variant>', 'Variant of the document.')
    .action(async (store, opts: CliOptions) => {
      const cliArgs: Args = {
        cmd: Cmd.document_delete,
        args: [store],
        opts,
      };

      await cmsExecutor(invocationDir, cliArgs);
    });

  documentCmd
    .command('publish')
    .alias('pub')
    .description('Publish the document.')
    .argument('<store>', 'Store name')
    .option('-p, --path <path>', 'Slash "/" separated path. Only for tree stores.')
    .option('-d, --doc <docId>', 'Document ID')
    .option('-v, --variant <variant>', 'Variant of the document.')
    .action(async (store, opts: CliOptions) => {
      const cliArgs: Args = {
        cmd: Cmd.document_publish,
        args: [store],
        opts,
      };

      await cmsExecutor(invocationDir, cliArgs);
    });
};
