import {Layer} from '../../kernel';
import {ContentSchema} from '../../loadables';
import {Document} from '../../common';

// TODO: think about how to strogly type those operations
export interface PersistenceLayer<Config> extends Layer<Config> {
  prepareSingletonRepo(schema: ContentSchema): Promise<void>;
  prepareCollectionRepo(schema: ContentSchema): Promise<void>;
  prepareTreeRepo(schema: ContentSchema): Promise<void>;

  getSingleton(documentId: string, variant?: string): Promise<Document<any> | undefined>;
  getFromCollection(collectionName: string, documentId: string, variant?: string): Promise<Document<any> | undefined>;
  getFromTree(treeName: string, path: string[], documentId: string, variant?: string): Promise<Document<any> | undefined>;

  putSingleton(documentId: string, document: Document<any>, variant?: string): Promise<Document<any>>;
  putToCollection(collectionName: string, documentId: string, document: Document<any>, variant?: string): Promise<Document<any>>;
  putToTree(treeName: string, path: string[], documentId: string, document: Document<any>, variant?: string): Promise<Document<any>>;
}
