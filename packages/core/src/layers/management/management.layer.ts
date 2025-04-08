import {AfterPortsBoundAware, Layer, Port} from '../../kernel';
import {Document} from '../../common';
import {ContentSchema} from '../../loadables';
import {SapphireFieldTypeClass} from '../content';
import {ZodTypeAny} from 'zod';

export interface ManagementLayer<Config> extends Layer<Config>, AfterPortsBoundAware {
  getDocumentPort: Port<(store: string, id: string) => Promise<Document<any>>>;
  putDocumentPort: Port<(store: string, document: Document<any>) => Promise<Document<any>>>;
  getContentSchemaPort: Port<(store: string) => Promise<ContentSchema>>;
  getTypeFactoriesPort: Port<() => Promise<Map<string, SapphireFieldTypeClass<any, any>>>>;
  getDocumentSchemaPort: Port<(store: string) => Promise<ZodTypeAny | undefined>>;
}
