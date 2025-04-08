import {ManagementLayer} from './management.layer';
import {createPort} from '../../kernel';
import {Document} from '../../common';
import {ContentSchema} from '../../loadables';
import {SapphireFieldTypeClass} from '../content';
import {ZodTypeAny} from 'zod';

export abstract class AbstractManagementLayer<Config> implements ManagementLayer<Config>{
  public readonly getDocumentPort = createPort<(store: string, id: string) => Promise<Document<any>>>();
  public readonly putDocumentPort = createPort<(store: string, document: Document<any>) => Promise<Document<any>>>();
  public readonly getContentSchemaPort = createPort<(store: string) => Promise<ContentSchema>>();
  public readonly getTypeFactoriesPort = createPort<() => Promise<Map<string, SapphireFieldTypeClass<any, any>>>>();
  public readonly getDocumentSchemaPort = createPort<(store: string) => Promise<ZodTypeAny | undefined>>();

  public abstract afterPortsBound(): Promise<void>;
}
