import {AfterPortsBoundAware, Layer} from '../../kernel';
import {Port, Document} from '../../common';
import {ContentSchema} from '../../loadables';
import {SapphireFieldTypeClass} from '../content/fields-typing.types';

export interface ManagementLayer<Config> extends Layer<Config>, AfterPortsBoundAware {
  createEmptyDocumentPort: Port<string, Document<any>>;
  getDocumentPort: Port<{ store: string, id: string }, Document<any>>;
  putDocumentPort: Port<{ store: string, document: Document<any> }, Document<any>>;
  getContentSchemaPort: Port<string, ContentSchema>;
  getTypeFactoriesPort: Port<void, Map<string, SapphireFieldTypeClass<any, any>>>;

  createEmptyDocument<T>(store: string): Promise<Document<T>>;
  getDocument<T>(store: string, id: string): Promise<Document<T>>;
  putDocument<T>(store: string, document: Document<T>): Promise<Document<T>>;
}
