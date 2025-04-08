import {ManagementLayer} from './management.layer';
import {createPort} from '../../kernel';
import {Document} from '../../common';
import {ContentSchema} from '../../loadables';
import {SapphireFieldTypeClass} from '../content';

export abstract class AbstractManagementLayer<Config> implements ManagementLayer<Config>{
  public readonly createEmptyDocumentPort = createPort<(store: string) => Promise<Document<any>>>();
  public readonly getDocumentPort = createPort<(store: string, id: string) => Promise<Document<any>>>();
  public readonly putDocumentPort = createPort<(store: string, document: Document<any>) => Promise<Document<any>>>();
  public readonly getContentSchemaPort = createPort<(store: string) => Promise<ContentSchema>>();
  public readonly getTypeFactoriesPort = createPort<() => Promise<Map<string, SapphireFieldTypeClass<any, any>>>>();

  public abstract afterPortsBound(): Promise<void>;
}
