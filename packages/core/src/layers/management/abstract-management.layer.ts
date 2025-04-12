import {ManagementLayer} from './management.layer';
import {createPort} from '../../kernel';
import {Document} from '../../common';
import {ContentSchema} from '../../loadables';
import {SapphireFieldTypeClass} from '../content';
import {ZodTypeAny} from 'zod';
import {DocumentInfo} from './document-info';

export abstract class AbstractManagementLayer<Config> implements ManagementLayer<Config> {
  public readonly getContentSchemaPort = createPort<(store: string) => Promise<ContentSchema | undefined>>();
  public readonly getTypeFactoriesPort = createPort<() => Promise<Map<string, SapphireFieldTypeClass<any, any>>>>();
  public readonly getDocumentSchemaPort = createPort<(store: string) => Promise<ZodTypeAny | undefined>>();

  public readonly listDocumentsPort = createPort<(store: string) => Promise<DocumentInfo[]>>();
  public readonly getDocumentIdsPort = createPort<(store: string) => Promise<string[]>>();
  public readonly getDocumentPort = createPort<(store: string, path: string[], id?: string, variant?: string) => Promise<Document<any> | undefined>>();
  public readonly putDocumentPort = createPort<(store: string, path: string[], content: any, id?: string, variant?: string) => Promise<Document<any>>>();

  public abstract afterPortsBound(): Promise<void>;
}
