import {Command} from '@commander-js/extra-typings';
import * as packageJson from '../../package.json';
import {CliOptions, Cmd} from '../common';

export type Args = {
  cmd: string;
  args: string[];
  opts?: CliOptions;
}

export function createProgram(onParse: (args: Args) => void): Command {
  const program = new Command()
      .name('sapphire-cms')
      .alias('scms')
      .description('Sapphire CMS command-line manager and content editor.')
      .version(packageJson.version);

  definePackageProgram(program, onParse);
  defineSchemaProgram(program, onParse);
  defineDocumentProgram(program, onParse);

  return program;
}

function definePackageProgram(main: Command, onParse: (args: Args) => void) {
  const packageCmd = main
      .command('package')
      .alias('pkg')
      .description('Install or remove Sapphire CMS packages.');

  packageCmd
      .command('install')
      .alias('i')
      .description('Install requested packages.')
      .argument('<packages...>', 'List of package names (without "@sapphire-cms/"). Example: "github"')
      .action((packages) => {
        onParse({
          cmd: Cmd.package_install,
          args: packages,
        });
      });

  packageCmd
      .command('remove')
      .alias('r')
      .description('Remove requested packages.')
      .argument('<packages...>', 'List of package names (without "@sapphire-cms/"). Example: "github"')
      .action((packages) => {
        onParse({
          cmd: Cmd.package_remove,
          args: packages,
        });
      });
}

function defineSchemaProgram(main: Command, onParse: (args: Args) => void) {
  const schemaCmd = main
      .command('schema')
      .alias('skm')
      .description('Manage content schemas.');

  schemaCmd
      .command('list')
      .alias('ls')
      .description('List existing content schemas.')
      .action(() => {
        // onParse({
        //   cmd: Cmd.document_create,
        //   args: [ store ],
        //   opts,
        // });
        // TODO: code
      });
}

function defineDocumentProgram(main: Command, onParse: (args: Args) => void) {
  const documentCmd = main
      .command('document')
      .alias('doc')
      .description('Create, edit or delete documents managed by CMS.');

  documentCmd
      .command('create')
      .alias('c')
      .description('Create a new document in the store')
      .argument('<store>', 'Store name')
      .option('-e, --editor <editor>',
          'Text editor to use. This option overrides editor in defined in configuration file.')
      .action((store, opts: CliOptions) => {
        onParse({
          cmd: Cmd.document_create,
          args: [ store ],
          opts,
        });
      });

  documentCmd
      .command('edit')
      .alias('e')
      .description('Edit existing document.')
      .argument('<store>', 'Store name')
      .argument('<docId>', 'Document ID')
      .option('-e, --editor <editor>',
          'Text editor to use. This option overrides editor in defined in configuration file.')
      .action((store, docId, opts: CliOptions) => {
        onParse({
          cmd: Cmd.document_edit,
          args: [ store, docId ],
          opts,
        });
      });

  documentCmd
      .command('delete')
      .alias('d')
      .description('Delete existing document.')
      .argument('<store>', 'Store name')
      .argument('<docId>', 'Document ID')
      .action((store, docId) => {
        onParse({
          cmd: Cmd.document_delete,
          args: [ store, docId ],
        });
      });
}
