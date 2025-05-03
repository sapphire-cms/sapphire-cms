import { ResultAsync } from 'neverthrow';
import { AnyParams, Option } from '../../common';
import { Layer, PersistenceError } from '../../kernel';
import { ContentMap, Document, DocumentInfo, HydratedContentSchema } from '../../model';

// TODO: collections should garantee the order
export interface PersistenceLayer<Config extends AnyParams | undefined = undefined>
  extends Layer<Config> {
  prepareSingletonRepo(schema: HydratedContentSchema): ResultAsync<void, PersistenceError>;
  prepareCollectionRepo(schema: HydratedContentSchema): ResultAsync<void, PersistenceError>;
  prepareTreeRepo(schema: HydratedContentSchema): ResultAsync<void, PersistenceError>;

  getContentMap(): ResultAsync<Option<ContentMap>, PersistenceError>;
  updateContentMap(contentMap: ContentMap): ResultAsync<void, PersistenceError>;

  // TODO: think about how to avoid to fetch the whole store
  listSingleton(documentId: string): ResultAsync<DocumentInfo[], PersistenceError>;
  listAllFromCollection(collectionName: string): ResultAsync<DocumentInfo[], PersistenceError>;
  listAllFromTree(treeName: string): ResultAsync<DocumentInfo[], PersistenceError>;

  getSingleton(
    documentId: string,
    variant: string,
  ): ResultAsync<Option<Document>, PersistenceError>;
  getFromCollection(
    collectionName: string,
    documentId: string,
    variant: string,
  ): ResultAsync<Option<Document>, PersistenceError>;
  getFromTree(
    treeName: string,
    path: string[],
    documentId: string,
    variant: string,
  ): ResultAsync<Option<Document>, PersistenceError>;

  putSingleton(
    documentId: string,
    variant: string,
    document: Document,
  ): ResultAsync<Document, PersistenceError>;
  putToCollection(
    collectionName: string,
    documentId: string,
    variant: string,
    document: Document,
  ): ResultAsync<Document, PersistenceError>;
  putToTree(
    treeName: string,
    path: string[],
    documentId: string,
    variant: string,
    document: Document,
  ): ResultAsync<Document, PersistenceError>;

  deleteSingleton(
    documentId: string,
    variant: string,
  ): ResultAsync<Option<Document>, PersistenceError>;
  deleteFromCollection(
    collectionName: string,
    documentId: string,
    variant: string,
  ): ResultAsync<Option<Document>, PersistenceError>;
  deleteFromTree(
    treeName: string,
    path: string[],
    documentId: string,
    variant: string,
  ): ResultAsync<Option<Document>, PersistenceError>;
}
