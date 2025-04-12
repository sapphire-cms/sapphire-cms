import {Command} from '@commander-js/extra-typings';
import * as packageJson from '../../package.json';
import {CliOptions, Cmd} from '../common';

export type Args = {
  cmd: string;
  args?: string[];
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
        onParse({
          cmd: Cmd.list_schemas,
        });
      });
}

function defineDocumentProgram(main: Command, onParse: (args: Args) => void) {
  const documentCmd = main
      .command('document')
      .alias('doc')
      .description('Create, edit or delete documents managed by CMS.');

  documentCmd
      .command('list')
      .alias('ls')
      .description("List all documents in the store")
      .argument('<id>', 'Store name')
      .action((store, opts: CliOptions) => {
        onParse({
          cmd: Cmd.document_list,
          args: [ store ],
          opts,
        });
      });

  documentCmd
      .command('print')
      .alias('p')
      .description('Print the content of the document')
      .argument('<id>', 'Store name')
      .option('-p, --path <path>',
          'Slash "/" separated path. Only for tree stores.')
      .option('-d, --doc <id>', 'Document ID')
      .option('-v, --variant <id>', 'Variant of the document.')
      .action((store, opts: CliOptions) => {
        onParse({
          cmd: Cmd.document_print,
          args: [ store ],
          opts,
        });
      });

  documentCmd
      .command('create')
      .alias('c')
      .description('Create a new document in the store')
      .argument('<id>', 'Store name')
      .option('-p, --path <path>',
          'Slash "/" separated path. Only for tree stores.')
      .option('-d, --doc <id>', 'Document ID')
      .option('-v, --variant <id>', 'Variant of the document.')
      .option('-e, --editor <string>',
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
      .argument('<id>', 'Store name')
      .option('-p, --path <path>',
          'Slash "/" separated path. Only for tree stores.')
      .option('-d, --doc <id>', 'Document ID')
      .option('-v, --variant <id>', 'Variant of the document.')
      .option('-e, --editor <string>',
          'Text editor to use. This option overrides editor in defined in configuration file.')
      .action((store, opts: CliOptions) => {
        onParse({
          cmd: Cmd.document_edit,
          args: [ store ],
          opts,
        });
      });

  documentCmd
      .command('ref-edit')
      .alias('rfe')
      .description('Edit existing document by provided document reference.')
      .argument('<ref>', 'Document reference')
      .option('-e, --editor <string>',
          'Text editor to use. This option overrides editor in defined in configuration file.')
      .action((ref, opts: CliOptions) => {
        onParse({
          cmd: Cmd.document_ref_edit,
          args: [ ref ],
          opts,
        });
      });

  documentCmd
      .command('delete')
      .alias('d')
      .description('Delete existing document.')
      .argument('<id>', 'Store name')
      .option('-p, --path <path>',
          'Slash "/" separated path. Only for tree stores.')
      .option('-d, --doc <id>', 'Document ID')
      .option('-v, --variant <id>', 'Variant of the document.')
      .action((store) => {
        onParse({
          cmd: Cmd.document_delete,
          args: [ store ],
        });
      });
}
