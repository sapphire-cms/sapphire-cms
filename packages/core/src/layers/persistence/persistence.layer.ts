import {Layer} from '../../kernel';
import {ContentMap, ContentSchema, Document} from '../../common';
import {DocumentInfo} from '../management';

// TODO: think about how to strogly type those operations
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
