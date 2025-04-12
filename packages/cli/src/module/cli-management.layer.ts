import {CliModuleParams} from './cli.module';
import {AbstractManagementLayer, Document, DocumentReference, makeHiddenCollectionName} from '@sapphire-cms/core';
import {Cmd, optsFromArray} from '../common';
import * as process from 'node:process';
import chalk from 'chalk';
import {TextFormService} from './services/textform.service';

const IN_DOC_COMMAND_PATTERN = /cmd:new\s+([^\s]+)/;

export class CliManagementLayer extends AbstractManagementLayer<CliModuleParams> {
  public constructor(private readonly params: { cmd: string, args: string[], opts: string[], editor: string | null; }) {
    super();
  }

  public async afterPortsBound(): Promise<void> {
    if (!this.params.cmd.startsWith('document')) {
      return Promise.resolve();
    }

    const store = this.params.args[0];

    const opts = optsFromArray(this.params.opts);
    const path: string[] = opts.get('path')
        ? (opts.get('path') as string).split('/')
        : [];
    const docId = opts.get('doc');
    const variant = opts.get('variant');

    const editor = opts.get('editor')
        || this.params.editor
        || process.env.EDITOR!;

    switch (this.params.cmd) {
      case Cmd.document_list:
        return this.listDocuments(store);
      case Cmd.document_print:
        return this.printDocument(store, path, docId, variant);
      case Cmd.document_create:
        return this.createDocument(editor, store, path, docId, variant).then(() => {});
      case Cmd.document_edit:
        return Promise.resolve();
      case Cmd.document_ref_edit:
        return Promise.resolve();
      case Cmd.package_remove:
        return Promise.resolve();
      default:
        throw new Error(`Unknown command: "${this.params.cmd}"`);
    }
  }

  private async listDocuments(store: string): Promise<void> {
    const docsInfo = await this.listDocumentsPort(store);

    for (const docInfo of docsInfo) {
      let str = chalk.blue(docInfo.store);

      if (docInfo.path.length) {
        str += chalk.yellow('/' + docInfo.path.join('/'))
      }

      if (docInfo.docId) {
        str += chalk.magenta('/' + docInfo.docId);
      }

      str += chalk.grey(' (variants: ' + docInfo.variants.join(', ') + ')');

      console.log(str);
    }
  }

  private async printDocument(store: string, path: string[], docId?: string, variant?: string): Promise<void> {
    const doc = await this.getDocumentPort(store, path, docId, variant);
    if (!doc) {
      const ref = new DocumentReference(store, path, docId, variant);
      console.error(chalk.red(`Document ${ ref.toString() } doesn't exist`));
      return;
    }

    console.dir(doc, {depth: null});
  }

  private async createDocument(editor: string, store: string, path: string[], docId?: string, variant?: string): Promise<Document<any>> {
    // TODO: check that document don't exist already

    const contentSchema = await this.getContentSchemaPort(store);
    if (!contentSchema) {
      throw new Error(`Unknown store: "${store}"`);
    }

    const fieldTypeFactories = await this.getTypeFactoriesPort();
    const documentSchema = await this.getDocumentSchemaPort(store);

    const textformService = new TextFormService(contentSchema, fieldTypeFactories, editor);
    const doc = await textformService.getDocument();

    // Process group fields
    for (const field of contentSchema.fields) {
      if (field.type === 'group') {
        doc[field.name] = await Promise.all(
          doc[field.name] = doc[field.name].map(async (groupRef: string) => {
            const match = groupRef.match(IN_DOC_COMMAND_PATTERN);
            if (!match) {
              return groupRef;
            }

            const groupFieldId = match[1];

            // Create group document in the hidden collection
            const hiddenCollection = makeHiddenCollectionName(store, field.name);
            const groupDoc = await this.createDocument(editor, hiddenCollection, [], groupFieldId, variant);
            return new DocumentReference(groupDoc.store, [], groupDoc.id, groupDoc.variant).toString();
          })
        );
      }
    }

    // Remove multiple fields
    for (const field of contentSchema.fields) {
      if (!field.isList) {
        doc[field.name] = doc[field.name].length ? doc[field.name][0] : undefined;
      }
    }

    const validationResult = documentSchema!.safeParse(doc);

    if (!validationResult.success) {
      throw new Error(
          `Document doesn't match the structure of schema "${store}":
          ${JSON.stringify(validationResult.error.format(), null, 2)}`);
    }

    return this.putDocumentPort(store, path, doc, docId, variant);
  }
}
