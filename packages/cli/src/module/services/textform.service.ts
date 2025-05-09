import * as path from 'path';
import {
  CombinedError,
  ContentValidationResult,
  DocumentContent,
  HydratedContentSchema,
  success,
  Outcome,
  Result,
} from '@sapphire-cms/core';
import { FsError, readTextFile, rmDirectory, writeFileSafeDir } from '@sapphire-cms/node';
import { collect, present, TextForm, TextFormField } from '@sapphire-cms/textform';
import { execa } from 'execa';
import { temporaryFile } from 'tempy';
import { dedent } from 'ts-dedent';
import { ProcessError, TextFormParseError } from '../../common';

export type ContentInput = Record<string, (string | number | boolean)[]>;

function contentToInput(content: DocumentContent): ContentInput {
  const input: ContentInput = {};

  for (const [field, value] of Object.entries(content)) {
    if (!value) {
      input[field] = [];
    } else if (Array.isArray(value)) {
      input[field] = value;
    } else {
      input[field] = [value];
    }
  }

  return input;
}

export class TextFormService {
  constructor(
    private readonly contentSchema: HydratedContentSchema,
    private readonly editor: string,
  ) {}

  public getDocumentContent(
    content?: DocumentContent,
    validation?: ContentValidationResult,
  ): Outcome<
    ContentInput,
    | FsError
    | TextFormParseError
    | ProcessError
    | CombinedError<FsError | TextFormParseError | ProcessError, FsError>
  > {
    const textform = this.createTextForm(content, validation);

    // Prepare TextForm input
    const textformFile = temporaryFile({ name: `${this.contentSchema.name}.textform` });

    return writeFileSafeDir(textformFile, present(textform))
      .andThen(() => {
        // Open TextForm with text editor
        return Outcome.fromSupplier(
          () => execa(this.editor, [textformFile], { stdio: 'inherit' }),
          (err) => new ProcessError(`Failed to open editor ${this.editor}`, err),
        );
      })
      .andThen(() => readTextFile(textformFile))
      .andThen((submittedForm) =>
        Result.fromThrowable(collect, (err) => new TextFormParseError(err))(
          textform,
          submittedForm,
        ).asyncAndThen((input) => success(input)),
      )
      .finally(() => rmDirectory(path.dirname(textformFile), true, true));
  }

  public createTextForm(content?: DocumentContent, validation?: ContentValidationResult): TextForm {
    const banner = dedent`
      ${this.contentSchema.label || this.contentSchema.name} ${this.contentSchema.description ? `- ${this.contentSchema.description}` : ''}
      New document.
      Note: Lines that start with % are comments — they’re here to guide you and should not be edited.
      Note: Required fields are marked with an asterisk *.
      Note: For fields that allow multiple entries, separate each entry with a line that contains at least three equals signs (===).
    `;

    const previousInput = content ? contentToInput(content) : {};
    const fields: TextFormField[] = [];

    for (const fieldSchema of this.contentSchema.fields) {
      const example = fieldSchema.example || fieldSchema.type.example;
      const values = previousInput[fieldSchema.name] || (example ? [example] : []);

      const formField: TextFormField<typeof fieldSchema.type.castTo> = {
        name: fieldSchema.name,
        type: fieldSchema.type.castTo,
        values,
        commentBlock: {
          label: fieldSchema.label,
          isRequired: fieldSchema.required,
          declaredType: fieldSchema.type.name,
          description: fieldSchema.description,
          example,
          notes: [],
        },
      };

      // Add errors for precedent input
      if (validation && !validation.fields[fieldSchema.name]?.isValid) {
        formField.commentBlock!.errors = validation.fields[fieldSchema.name].errors;
      }

      // Add type specific notes and examples
      if (fieldSchema.type.castTo === 'boolean') {
        formField.commentBlock!.notes!.push(
          'This is a check field. To mark it as checked, put anything between the square brackets [ ]. Leave it empty to keep it unchecked.',
        );

        if (!formField.values!.length) {
          formField.values!.push(false);
        }
      }

      if (fieldSchema.isList) {
        formField.commentBlock!.notes!.push(
          'This is a multi-entry field. Separate each entry with a line that contains at least three equals signs (===).',
        );
      }

      if (fieldSchema.type.name === 'tag') {
        const tagParams = fieldSchema.type.params;
        const allTags = (tagParams.values as string[]).map((tag: string) => '#' + tag).join(' ');
        const many = tagParams.multiple ? 'Can choose many' : 'Cannot choose many';
        formField.commentBlock!.notes!.push(`One of (${many}): ${allTags}`);

        if (!formField.values!.length) {
          formField.values!.push('#' + (tagParams.values as string[])[0]);
        }
      }

      if (fieldSchema.type.name === 'rich-text') {
        formField.commentBlock!.notes!.push(
          'This is a rich text field. Use Markdown for formatting — like headings, bold text, and lists.',
        );
      }

      if (fieldSchema.type.name === 'reference') {
        formField.commentBlock!.notes!.push(
          'To modify referenced document execute "sapphire-cms document ref-edit <reference>" on terminal.',
        );
      }

      if (fieldSchema.type.name === 'group') {
        formField.commentBlock!.notes!.push(
          'This is a group field. You cannot directly modify its content. ' +
            'To create the new group field use command input "cmd:new [docId]" ' +
            'where docId is optional identifier of the document.',

          'To modify existing group field execute "sapphire-cms document ref-edit <reference>" on terminal.',
        );
      }

      fields.push(formField);
    }

    return {
      banner,
      fields,
    };
  }
}
