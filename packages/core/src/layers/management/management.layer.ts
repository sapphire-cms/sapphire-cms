import {AfterPortsBoundAware, Layer, Port} from '../../kernel';
import {DocumentInfo} from './document-info';
import {ContentValidationResult, Document, DocumentContent, HydratedContentSchema} from '../../model';

export interface ManagementLayer<Config> extends Layer<Config>, AfterPortsBoundAware {
  getContentSchemaPort: Port<(store: string) => Promise<HydratedContentSchema | undefined>>;
  validateContentPort: Port<(store: string, content: DocumentContent) => Promise<ContentValidationResult<any>>>

  listDocumentsPort: Port<(store: string) => Promise<DocumentInfo[]>>;
  getDocumentPort: Port<(store: string, path: string[], docId?: string, variant?: string) => Promise<Document | undefined>>;
  putDocumentPort: Port<(store: string, path: string[], content: DocumentContent, docId?: string, variant?: string) => Promise<Document>>;
  deleteDocumentPort: Port<(store: string, path: string[], docId?: string, variant?: string) => Promise<Document | undefined>>;
  renderDocumentPort: Port<(store: string, path: string[], docId?: string, variant?: string) => Promise<void>>;
}
