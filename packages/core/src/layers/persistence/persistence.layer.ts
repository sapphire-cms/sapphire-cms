import {AnyParams} from '../../common';
import {Layer} from '../../kernel';
import {ContentMap, Document, DocumentInfo, HydratedContentSchema} from '../../model';

// TODO: collections should garantee the order
export interface PersistenceLayer<Config extends AnyParams | undefined = undefined> extends Layer<Config> {
  prepareSingletonRepo(schema: HydratedContentSchema): Promise<void>;
  prepareCollectionRepo(schema: HydratedContentSchema): Promise<void>;
  prepareTreeRepo(schema: HydratedContentSchema): Promise<void>;

  getContentMap(): Promise<ContentMap | undefined>;
  updateContentMap(contentMap: ContentMap): Promise<void>;

  // TODO: think about how to avoid to fetch the whole store
  listSingleton(documentId: string): Promise<DocumentInfo[]>;
  listAllFromCollection(collectionName: string): Promise<DocumentInfo[]>;
  listAllFromTree(treeName: string): Promise<DocumentInfo[]>;

  getSingleton(documentId: string, variant: string): Promise<Document | undefined>;
  getFromCollection(collectionName: string, documentId: string, variant: string): Promise<Document | undefined>;
  getFromTree(treeName: string, path: string[], documentId: string, variant: string): Promise<Document | undefined>;

  putSingleton(documentId: string, variant: string, document: Document): Promise<Document>;
  putToCollection(collectionName: string, documentId: string, variant: string, document: Document): Promise<Document>;
  putToTree(treeName: string, path: string[], documentId: string, variant: string, document: Document): Promise<Document>;

  deleteSingleton(documentId: string, variant: string): Promise<Document | undefined>;
  deleteFromCollection(collectionName: string, documentId: string, variant: string): Promise<Document | undefined>;
  deleteFromTree(treeName: string, path: string[], documentId: string, variant: string): Promise<Document | undefined>;
}
