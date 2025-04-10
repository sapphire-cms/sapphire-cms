import {
  collect,
  ContentSchema, FieldTypeSchema,
  getFieldTypeMetadataFromClass, present,
  SapphireFieldTypeClass,
  TextForm,
  TextFormField
} from '@sapphire-cms/core';
import {dedent} from 'ts-dedent';
import {temporaryFile} from 'tempy';
import {promises as fs} from 'fs';
import {execa} from 'execa';
import * as path from 'path';

export class TextFormService {
  public constructor(private readonly contentSchema: ContentSchema,
                     private readonly fieldTypeFactories: Map<string, SapphireFieldTypeClass<any, any>>,
                     private readonly editor: string) {
  }

  public async getDocument(): Promise<any> {
    const textform = this.createTextForm();

    // Prepare TextForm input
    const textformFile = temporaryFile({ name: `${this.contentSchema.name}.textform` });

    try {
      await fs.writeFile(textformFile, present(textform));

      // Open TextForm with text editor
      await execa(this.editor, [textformFile], { stdio: 'inherit' });

      const submittedForm = await fs.readFile(textformFile, 'utf-8');

      return collect(textform, submittedForm)
    } finally {
      await fs.rm(path.dirname(textformFile), {recursive: true, force: true});
    }
  }

  public createTextForm(): TextForm {
    const banner = dedent`
      ${ this.contentSchema.label || this.contentSchema.name } ${ this.contentSchema.description ? `- ${this.contentSchema.description}` : '' }
      New document.
      Note: Lines that start with % are comments — they’re here to guide you and should not be edited.
      Note: Required fields are marked with an asterisk *.
      Note: For fields that allow multiple entries, separate each entry with a line that contains at least three equals signs (===).
    `;

    const fields: TextFormField[] = [];

    for (const fieldSchema of this.contentSchema.fields) {
      const fieldType = typeof fieldSchema.type === 'string' ? fieldSchema.type : fieldSchema.type.name;

      const fieldTypeFactory = this.fieldTypeFactories.get(fieldType);
      if (!fieldTypeFactory) {
        throw new Error(`Unknown type: "${fieldType}"`);
      }

      const meta = getFieldTypeMetadataFromClass(fieldTypeFactory);
      const example = fieldSchema.example || meta?.example;

      const formField: TextFormField = {
        name: fieldSchema.name,
        type: meta!.castTo,
        values: example ? [ example as any ] : [],
        commentBlock: {
          label: fieldSchema.label,
          isRequired: fieldSchema.required,
          declaredType: fieldType,
          description: fieldSchema.description,
          example,
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
