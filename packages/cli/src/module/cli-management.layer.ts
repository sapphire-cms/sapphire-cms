import {CliModuleParams} from './cli.module';
import {AbstractManagementLayer} from '@sapphire-cms/core';
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
        const storeName = this.params.args[0];
        const contentSchema = await this.getContentSchemaPort(storeName);
        const fieldTypeFactories = await this.getTypeFactoriesPort();
        const documentSchema = await this.getDocumentSchemaPort(storeName);

        const textformService = new TextFormService(contentSchema, fieldTypeFactories, editor);
        const doc = await textformService.getDocument();

        // Remove multiple fields
        for (const field of contentSchema.fields) {
          if (!field.isList) {
            doc[field.name] = doc[field.name].length ? doc[field.name][0] : undefined;
          }
        }

        const validationResult = documentSchema!.safeParse(doc);

        if (!validationResult.success) {
          throw new Error(
              `Document doesn't match the structure of schema "${storeName}":
          ${JSON.stringify(validationResult.error.format(), null, 2)}`);
        }

        return this.putDocumentPort(storeName, doc).then(() => {});
      case Cmd.document_edit:
        return Promise.resolve();
      case Cmd.package_remove:
        return Promise.resolve();
      default:
        throw new Error(`Unknown command: "${this.params.cmd}"`);
    }
  }
}
