import {ManagementLayer} from './management.layer';
import {createPort} from '../../kernel';
import {ContentValidationResult, Document, DocumentContent} from '../../common';
import {ContentSchema} from '../../loadables';
import {SapphireFieldTypeClass} from '../content';
import {DocumentInfo} from './document-info';

export abstract class AbstractManagementLayer<Config> implements ManagementLayer<Config> {
  public readonly getContentSchemaPort = createPort<(store: string) => Promise<ContentSchema | undefined>>();
  public readonly getTypeFactoriesPort = createPort<() => Promise<Map<string, SapphireFieldTypeClass<any, any>>>>();
  public readonly validateContentPort = createPort<(store: string, content: DocumentContent) => Promise<ContentValidationResult<any>>>();

  public readonly listDocumentsPort = createPort<(store: string) => Promise<DocumentInfo[]>>();
  public readonly getDocumentPort = createPort<(store: string, path: string[], docId?: string, variant?: string) => Promise<Document<any> | undefined>>();
  public readonly putDocumentPort = createPort<(store: string, path: string[], content: DocumentContent, docId?: string, variant?: string) => Promise<Document<any>>>();

  public abstract afterPortsBound(): Promise<void>;
}
