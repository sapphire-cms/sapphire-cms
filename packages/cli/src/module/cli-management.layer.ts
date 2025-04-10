import {CliModuleParams} from './cli.module';
import {AbstractManagementLayer, Document} from '@sapphire-cms/core';
import {Cmd, optsFromArray} from '../common';
import * as process from 'node:process';
import {TextFormService} from './services/textform.service';

export class CliManagementLayer extends AbstractManagementLayer<CliModuleParams> {
  public constructor(private readonly params: { cmd: string, args: string[], opts: string[], editor: string | null; }) {
    super();
  }

  public async afterPortsBound(): Promise<void> {
    if (!this.params.cmd.startsWith('document')) {
      return Promise.resolve();
    }

    const opts = optsFromArray(this.params.opts);
    const editor = opts.get('editor')
        || this.params.editor
        || process.env.EDITOR!;

    switch (this.params.cmd) {
      case Cmd.document_create:
        const store = this.params.args[0];
        return this.createDocument(store, editor).then(() => {});
      case Cmd.document_edit:
        return Promise.resolve();
      case Cmd.package_remove:
        return Promise.resolve();
      default:
        throw new Error(`Unknown command: "${this.params.cmd}"`);
    }
  }

  private async createDocument(store: string, editor: string): Promise<Document<any>> {
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
            if (!groupRef.includes('cmd:new')) {
              return groupRef;
            }

            // Create group document in the hidden collection
            const hiddenCollection = `${store}__field-${field.name}`;
            const groupDoc = await this.createDocument(hiddenCollection, editor);
            return `${hiddenCollection}:${groupDoc.id}`;
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

    return this.putDocumentPort(store, [], doc);
  }
}
