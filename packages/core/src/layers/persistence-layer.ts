import {DocumentSchema} from '../model/document-schema';

// TODO: think about how to strogly type those operations
export interface PersistenceLayer {
  prepareStore(schema: DocumentSchema): Promise<void>;

  getSingleton(documentId: string): Promise<any | null>;
  getFromCollection(collectionName: string, documentId: string): Promise<any | null>;
  getFromTree(...path: string[]): Promise<any | null>;

  putSingleton(documentId: string, document: any): Promise<void>;
  putToCollection(collectionName: string, documentId: string, document: any): Promise<void>;
  putToTree(path: string[], document: any): Promise<void>;
}
