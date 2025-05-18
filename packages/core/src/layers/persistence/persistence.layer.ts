import { Outcome } from 'defectless';
import { AnyParams, Option } from '../../common';
import { Layer, PersistenceError } from '../../kernel';
import { ContentMap, Document, DocumentInfo, HydratedContentSchema } from '../../model';

// TODO: collections should garantee the order
export interface PersistenceLayer<Config extends AnyParams | undefined = undefined>
  extends Layer<Config> {
  prepareSingletonRepo(schema: HydratedContentSchema): Outcome<void, PersistenceError>;
  prepareCollectionRepo(schema: HydratedContentSchema): Outcome<void, PersistenceError>;
  prepareTreeRepo(schema: HydratedContentSchema): Outcome<void, PersistenceError>;

  getContentMap(): Outcome<Option<ContentMap>, PersistenceError>;
  updateContentMap(contentMap: ContentMap): Outcome<void, PersistenceError>;

  // TODO: think about how to avoid to fetch the whole store
  listSingleton(documentId: string): Outcome<DocumentInfo[], PersistenceError>;
  listAllFromCollection(collectionName: string): Outcome<DocumentInfo[], PersistenceError>;
  listAllFromTree(treeName: string): Outcome<DocumentInfo[], PersistenceError>;

  getSingleton(documentId: string, variant: string): Outcome<Option<Document>, PersistenceError>;
  getFromCollection(
    collectionName: string,
    documentId: string,
    variant: string,
  ): Outcome<Option<Document>, PersistenceError>;
  getFromTree(
    treeName: string,
    path: string[],
    documentId: string,
    variant: string,
  ): Outcome<Option<Document>, PersistenceError>;

  putSingleton(
    documentId: string,
    variant: string,
    document: Document,
  ): Outcome<Document, PersistenceError>;
  putToCollection(
    collectionName: string,
    documentId: string,
    variant: string,
    document: Document,
  ): Outcome<Document, PersistenceError>;
  putToTree(
    treeName: string,
    path: string[],
    documentId: string,
    variant: string,
    document: Document,
  ): Outcome<Document, PersistenceError>;

  deleteSingleton(documentId: string, variant: string): Outcome<Option<Document>, PersistenceError>;
  deleteFromCollection(
    collectionName: string,
    documentId: string,
    variant: string,
  ): Outcome<Option<Document>, PersistenceError>;
  deleteFromTree(
    treeName: string,
    path: string[],
    documentId: string,
    variant: string,
  ): Outcome<Option<Document>, PersistenceError>;
}
