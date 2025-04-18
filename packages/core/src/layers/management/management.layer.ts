import {AfterPortsBoundAware, Layer, Port} from '../../kernel';
import {ContentValidationResult, Document, DocumentContent} from '../../common';
import {ContentSchema} from '../../loadables';
import {SapphireFieldTypeClass} from '../content';
import {DocumentInfo} from './document-info';

export interface ManagementLayer<Config> extends Layer<Config>, AfterPortsBoundAware {
  getContentSchemaPort: Port<(store: string) => Promise<ContentSchema | undefined>>;
  // TODO: think how to avoid to expose classes from content layer to management
  getTypeFactoriesPort: Port<() => Promise<Map<string, SapphireFieldTypeClass<any, any>>>>;
  validateContentPort: Port<(store: string, content: DocumentContent) => Promise<ContentValidationResult<any>>>

  listDocumentsPort: Port<(store: string) => Promise<DocumentInfo[]>>;
  getDocumentPort: Port<(store: string, path: string[], docId?: string, variant?: string) => Promise<Document | undefined>>;
  putDocumentPort: Port<(store: string, path: string[], content: DocumentContent, docId?: string, variant?: string) => Promise<Document>>;
  deleteDocumentPort: Port<(store: string, path: string[], docId?: string, variant?: string) => Promise<Document | undefined>>;
  renderDocumentPort: Port<(store: string, path: string[], docId?: string, variant?: string) => Promise<void>>;
}
