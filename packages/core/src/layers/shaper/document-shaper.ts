import { Outcome } from 'defectless';
import { ShaperError } from '../../kernel';
import { DocumentContentInlined, DocumentShapingError, HydratedContentSchema } from '../../model';

export interface DocumentShaper<T extends DocumentContentInlined = DocumentContentInlined> {
  shapeDocument(
    documentContent: T,
    contentSchema?: HydratedContentSchema,
  ): Outcome<DocumentContentInlined, DocumentShapingError | ShaperError>;
}
