import {AnyParams} from '../../common';
import {createPort} from '../../kernel';
import {ContentValidationResult, Document, DocumentContent, DocumentInfo, HydratedContentSchema} from '../../model';
import {ManagementLayer} from './management.layer';

export abstract class AbstractManagementLayer<Config extends AnyParams | undefined = undefined> implements ManagementLayer<Config> {
  public readonly getContentSchemaPort = createPort<(store: string) => Promise<HydratedContentSchema | undefined>>();
  public readonly validateContentPort = createPort<(store: string, content: DocumentContent) => Promise<ContentValidationResult<DocumentContent>>>();

  public readonly listDocumentsPort = createPort<(store: string) => Promise<DocumentInfo[]>>();
  public readonly getDocumentPort = createPort<(store: string, path: string[], docId?: string, variant?: string) => Promise<Document | undefined>>();
  public readonly putDocumentPort = createPort<(store: string, path: string[], content: DocumentContent, docId?: string, variant?: string) => Promise<Document>>();
  public readonly deleteDocumentPort = createPort<(store: string, path: string[], docId?: string, variant?: string) => Promise<Document | undefined>>();
  public readonly renderDocumentPort = createPort<(store: string, path: string[], docId?: string, variant?: string) => Promise<void>>();

  public abstract afterPortsBound(): Promise<void>;
}
