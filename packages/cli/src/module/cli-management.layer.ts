import {CliModuleParams} from './cli.module';
import {
  AbstractManagementLayer,
  ContentSchema,
  FieldTypeSchema,
  getFieldTypeMetadataFromClass,
  present,
  SapphireFieldTypeClass,
  TextForm,
  TextFormField
} from '@sapphire-cms/core';
import {Cmd, optsFromArray} from '../common';
import {temporaryFile} from 'tempy';
import {promises as fs} from 'fs'
import * as path from 'path';
import {execa} from 'execa';
import * as process from 'node:process';
import {dedent} from 'ts-dedent';

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

        // Get content schema for the store
        const contentSchema = await this.getContentSchemaPort(storeName);
        const fieldTypeFactories = await this.getTypeFactoriesPort();

        const textform = present(this.createTextForm(contentSchema, fieldTypeFactories));

        // Create textform file
        const textformFile = temporaryFile({ name: `${storeName}.textform` });
        await fs.writeFile(textformFile, textform);

        await execa(editor, [textformFile], { stdio: 'inherit' });

        const submittedForm = await fs.readFile(textformFile, 'utf-8');
        console.log(submittedForm);

        return fs.rm(path.dirname(textformFile), {recursive: true, force: true});
      case Cmd.document_edit:
        return Promise.resolve();
      case Cmd.package_remove:
        return Promise.resolve();
      default:
        throw new Error(`Unknown command: "${this.params.cmd}"`);
    }
  }

  private createTextForm(contentSchema: ContentSchema,
                         fieldTypeFactories: Map<string, SapphireFieldTypeClass<any, any>>): TextForm {
    const banner = dedent`
      ${ contentSchema.label || contentSchema.name } ${ contentSchema.description ? `- ${contentSchema.description}` : '' }
      New document.
      Note: Lines that start with % are comments — they’re here to guide you and should not be edited.
      Note: Required fields are marked with an asterisk *.
      Note: For fields that allow multiple entries, separate each entry with a line that contains at least three equals signs (===).
    `;

    const fields: TextFormField[] = [];

    for (const fieldSchema of contentSchema.fields) {
      const fieldType = typeof fieldSchema.type === 'string' ? fieldSchema.type : fieldSchema.type.name;

      const fieldTypeFactory = fieldTypeFactories.get(fieldType);
      if (!fieldTypeFactory) {
        throw new Error(`Unknown type: "${fieldType}"`);
      }

      const meta = getFieldTypeMetadataFromClass(fieldTypeFactory);

      const formField: TextFormField = {
        name: fieldSchema.name,
        type: meta!.castTo,
        values: meta!.example ? [ meta!.example as any ] : [],
        commentBlock: {
          label: fieldSchema.label,
          isRequired: fieldSchema.required,
          declaredType: fieldType,
          description: fieldSchema.description,
          example: meta?.example,
          notes: [],
        },
      };

      // Add type specific notes and examples
      if (meta!.castTo === 'boolean') {
        formField.commentBlock!.notes!.push(
            'This is a check field. To mark it as checked, put anything between the square brackets [ ]. Leave it empty to keep it unchecked.'
        );

        if (!formField.values!.length) {
          formField.values!.push(false as any);
        }
      }

      if (fieldSchema.isList) {
        formField.commentBlock!.notes!.push(
            'This is a multi-entry field. Separate each entry with a line that contains at least three equals signs (===).'
        );
      }

      if (fieldType === 'tag') {
        const tagParams = ((fieldSchema.type as FieldTypeSchema).params as any);
        const allTags = tagParams.values.map((tag: string) => '#' + tag).join(' ');
        const many = tagParams.multiple ? 'Can choose many' : 'Cannot choose many';
        formField.commentBlock!.notes!.push(
            `One of (${many}): ${allTags}`
        );

        if (!formField.values!.length) {
          formField.values!.push('#' + tagParams.values[0] as any);
        }
      }

      if (fieldType === 'rich-text') {
        formField.commentBlock!.notes!.push(
            'This is a rich text field. Use Markdown for formatting — like headings, bold text, and lists.'
        );
      }

      fields.push(formField);
    }

    return {
      banner,
      fields,
    }
  }
}
