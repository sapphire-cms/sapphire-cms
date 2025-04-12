import {Layer} from '../../kernel';
import {ContentSchema} from '../../loadables';
import {Document} from '../../common';
import {DocumentInfo} from '../management';

// TODO: think about how to strogly type those operations
export interface PersistenceLayer<Config> extends Layer<Config> {
  prepareSingletonRepo(schema: ContentSchema): Promise<void>;
  prepareCollectionRepo(schema: ContentSchema): Promise<void>;
  prepareTreeRepo(schema: ContentSchema): Promise<void>;

  // TODO: think about how to avoid to fetch the whole store
  listSingleton(documentId: string): Promise<DocumentInfo[]>;
  listAllFromCollection(collectionName: string): Promise<DocumentInfo[]>;
  listAllFromTree(treeName: string): Promise<DocumentInfo[]>;

  listIdsSingletons(): Promise<string[]>;
  listIdsCollection(collectionName: string): Promise<string[]>;
  listIdsTree(treeName: string): Promise<string[]>;

  getSingleton(documentId: string, variant: string): Promise<Document<any> | undefined>;
  getFromCollection(collectionName: string, documentId: string, variant: string): Promise<Document<any> | undefined>;
  getFromTree(treeName: string, path: string[], documentId: string, variant: string): Promise<Document<any> | undefined>;

  putSingleton(documentId: string, variant: string, document: Document<any>): Promise<Document<any>>;
  putToCollection(collectionName: string, documentId: string, variant: string, document: Document<any>): Promise<Document<any>>;
  putToTree(treeName: string, path: string[], documentId: string, variant: string, document: Document<any>): Promise<Document<any>>;
}
