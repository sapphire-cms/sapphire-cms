import {Layer} from '../../kernel';
import {DocumentInfo} from '../management';
import {ContentMap, ContentSchema, Document} from '../../model';

// TODO: collections should garantee the order
export interface PersistenceLayer<Config> extends Layer<Config> {
  prepareSingletonRepo(schema: ContentSchema): Promise<void>;
  prepareCollectionRepo(schema: ContentSchema): Promise<void>;
  prepareTreeRepo(schema: ContentSchema): Promise<void>;

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
