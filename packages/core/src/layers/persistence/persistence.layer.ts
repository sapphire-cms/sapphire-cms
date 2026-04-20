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

  /**
   * Starts a new persistence transaction.
   * All writes and deletes initiated between the start and completion of this transaction are commited together.
   * Use of transactions is not mandatory. Implementations of persistence layer must allow to save and delete individual
   * documents without initiation of transaction.
   * Some persistence engines do not support transactions. In that case, execution of this operation will have no
   * effect.
   *
   * @return Outcome containing unique identifier of created transaction. The format of that identifier is specific to
   * persistence layer implementation.
   */
  startTransaction(): Outcome<string, PersistenceError>;

  /**
   * Completes an ongoing persistence transaction, by commiting all writes and deletes initiated since its start.
   * Some persistence engines do not support transactions. In that case, execution of this operation will have no
   * effect.
   * If there is no ongoing transaction with provided id, this method will return errored Outcome.
   *
   * @param transactionId  unique identifier of transaction
   */
  completeTransaction(transactionId: string): Outcome<void, PersistenceError>;

  /**
   * Aborts ongoing persistence transaction, discarding all writes and deletes initiated since its start.
   * Some persistence engines do not support transactions. In that case, execution of this operation will have no
   * effect.
   * If there is no ongoing transaction with provided id, this method will return errored Outcome.
   *
   * @param transactionId  unique identifier of transaction
   */
  abortTransaction(transactionId: string): Outcome<void, PersistenceError>;

  updateContentMap(contentMap: ContentMap, transactionId?: string): Outcome<void, PersistenceError>;

  putSingleton(
    documentId: string,
    variant: string,
    document: Document,
    transactionId?: string,
  ): Outcome<Document, PersistenceError>;
  putToCollection(
    collectionName: string,
    documentId: string,
    variant: string,
    document: Document,
    transactionId?: string,
  ): Outcome<Document, PersistenceError>;
  putToTree(
    treeName: string,
    path: string[],
    documentId: string,
    variant: string,
    document: Document,
    transactionId?: string,
  ): Outcome<Document, PersistenceError>;

  deleteSingleton(
    documentId: string,
    variant: string,
    transactionId?: string,
  ): Outcome<Option<Document>, PersistenceError>;
  deleteFromCollection(
    collectionName: string,
    documentId: string,
    variant: string,
    transactionId?: string,
  ): Outcome<Option<Document>, PersistenceError>;
  deleteFromTree(
    treeName: string,
    path: string[],
    documentId: string,
    variant: string,
    transactionId?: string,
  ): Outcome<Option<Document>, PersistenceError>;
}
