import { Outcome, Program, program } from 'defectless';
import { ShaperError } from '../../kernel';
import { DocumentShaper } from '../../layers';
import {
  DocumentContentInlined,
  DocumentShapingError,
  HydratedContentSchema,
  HydratedFieldSchema,
  RecursiveValue,
} from '../../model';
import { MediaResolverFieldShaper } from './media-resolver-field-shaper';

const mdMediaReferenceRegex = /!?\[[^\]]*]\((cms-media:[^)\s]+)\)/g;

export class MediaResolverDocumentShaper implements DocumentShaper {
  constructor(private readonly fieldMediaResolver: MediaResolverFieldShaper) {}

  public shapeDocument(
    documentContent: DocumentContentInlined,
    contentSchema: HydratedContentSchema,
  ): Outcome<DocumentContentInlined, DocumentShapingError | ShaperError> {
    return this.shape(documentContent, contentSchema);
  }

  private shape(
    content: { [key: string]: RecursiveValue },
    schema: HydratedContentSchema | HydratedFieldSchema,
  ): Outcome<{ [key: string]: RecursiveValue }, DocumentShapingError | ShaperError> {
    const mediaFields = schema.fields.filter((field) => field.type.name === 'media');
    const richTextFields = schema.fields.filter((field) => field.type.name === 'rich-text');
    const groupFields = schema.fields.filter((field) => field.type.name === 'media');

    return program(function* (): Program<
      { [key: string]: RecursiveValue },
      DocumentShapingError | ShaperError
    > {
      for (const mediaField of mediaFields) {
        if (mediaField.isList) {
          const values = content[mediaField.name] as string[];
          for (let i = 0; i < values.length; i++) {
            values[i] = yield this.fieldMediaResolver.transform(values[i]);
          }
        } else {
          const value = content[mediaField.name] as string;
          content[mediaField.name] = yield this.fieldMediaResolver.transform(value);
        }
      }

      for (const richTextField of richTextFields) {
        if (richTextField.isList) {
          const values = content[richTextField.name] as string[];
          for (let i = 0; i < values.length; i++) {
            values[i] = yield this.resolveMdReferences(values[i]);
          }
        } else {
          const value = content[richTextField.name] as string;
          content[richTextField.name] = yield this.resolveMdReferences(value);
        }
      }

      for (const groupField of groupFields) {
        if (groupField.isList) {
          const values = content[groupField.name] as { [key: string]: RecursiveValue }[];
          for (let i = 0; i < values.length; i++) {
            values[i] = yield this.shape(values[i], groupField);
          }
        } else {
          const value = content[groupField.name] as { [key: string]: RecursiveValue };
          content[groupField.name] = yield this.shape(value, groupField);
        }
      }

      return content;
    }, this);
  }

  private resolveMdReferences(markdown: string): Outcome<string, ShaperError> {
    const matches = [...markdown.matchAll(mdMediaReferenceRegex)];

    return program(function* (): Program<string, ShaperError> {
      const replacements: { original: string; replacement: string }[] = yield Outcome.all(
        matches
          .map((match) => match[1])
          .map((original) => {
            const ref = original.split(':').join('/') + ':default';
            return this.fieldMediaResolver.transform(ref).map((replacement) => {
              return { original, replacement };
            });
          }),
      ).mapFailure((errors) => {
        const message = errors
          .filter((error) => !!error)
          .map((error) => error!.message)
          .join('\n');
        return new ShaperError(message);
      });

      let result = markdown;
      replacements.forEach((replacement) => {
        result = result.replace(replacement.original, replacement.replacement);
      });

      return result;
    }, this);
  }
}
