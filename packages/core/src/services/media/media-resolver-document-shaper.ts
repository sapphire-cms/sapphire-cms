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
}
