import {AfterPortsBoundAware, Layer, Port} from '../../kernel';
import {Document} from '../../common';
import {ContentSchema} from '../../loadables';
import {SapphireFieldTypeClass} from '../content';
import {ZodTypeAny} from 'zod';

export interface ManagementLayer<Config> extends Layer<Config>, AfterPortsBoundAware {
  getContentSchemaPort: Port<(store: string) => Promise<ContentSchema | undefined>>;
  getTypeFactoriesPort: Port<() => Promise<Map<string, SapphireFieldTypeClass<any, any>>>>;
  getDocumentSchemaPort: Port<(store: string) => Promise<ZodTypeAny | undefined>>;

  getDocumentPort: Port<(store: string, path: string[], id: string, variant?: string) => Promise<Document<any>>>;
  putDocumentPort: Port<(store: string, path: string[], content: any, id?: string, variant?: string) => Promise<Document<any>>>;
}
