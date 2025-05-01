import {AnyParams} from '../../common';
import {AfterPortsBoundAware, Layer, Port} from '../../kernel';
import {ContentValidationResult, Document, DocumentContent, DocumentInfo, HydratedContentSchema} from '../../model';

export interface ManagementLayer<Config extends AnyParams | undefined = undefined> extends Layer<Config>, AfterPortsBoundAware {
  getContentSchemaPort: Port<(store: string) => Promise<HydratedContentSchema | undefined>>;
  validateContentPort: Port<(store: string, content: DocumentContent) => Promise<ContentValidationResult<DocumentContent>>>

  listDocumentsPort: Port<(store: string) => Promise<DocumentInfo[]>>;
  getDocumentPort: Port<(store: string, path: string[], docId?: string, variant?: string) => Promise<Document | undefined>>;
  putDocumentPort: Port<(store: string, path: string[], content: DocumentContent, docId?: string, variant?: string) => Promise<Document>>;
  deleteDocumentPort: Port<(store: string, path: string[], docId?: string, variant?: string) => Promise<Document | undefined>>;
  renderDocumentPort: Port<(store: string, path: string[], docId?: string, variant?: string) => Promise<void>>;
}
