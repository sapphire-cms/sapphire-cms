import { Outcome } from 'defectless';
import { Option } from '../../common';
import { PersistenceError } from '../../kernel';
import { ContentMap, Document, DocumentInfo, HydratedContentSchema } from '../../model';
import { PersistenceLayer } from './persistence.layer';

export class NoneBackupLayer implements PersistenceLayer {
  public prepareSingletonRepo(_schema: HydratedContentSchema): Outcome<void, PersistenceError> {
    return Outcome.failure(new PersistenceError('Backup layer is not defined'));
  }

  public prepareCollectionRepo(_schema: HydratedContentSchema): Outcome<void, PersistenceError> {
    return Outcome.failure(new PersistenceError('Backup layer is not defined'));
  }

  public prepareTreeRepo(_schema: HydratedContentSchema): Outcome<void, PersistenceError> {
    return Outcome.failure(new PersistenceError('Backup layer is not defined'));
  }

  public getContentMap(): Outcome<Option<ContentMap>, PersistenceError> {
    return Outcome.failure(new PersistenceError('Backup layer is not defined'));
  }

  public listSingleton(_documentId: string): Outcome<DocumentInfo[], PersistenceError> {
    return Outcome.failure(new PersistenceError('Backup layer is not defined'));
  }

  public listAllFromCollection(_collectionName: string): Outcome<DocumentInfo[], PersistenceError> {
    return Outcome.failure(new PersistenceError('Backup layer is not defined'));
  }

  public listAllFromTree(_treeName: string): Outcome<DocumentInfo[], PersistenceError> {
    return Outcome.failure(new PersistenceError('Backup layer is not defined'));
  }

  public getSingleton(
    _documentId: string,
    _variant: string,
  ): Outcome<Option<Document>, PersistenceError> {
    return Outcome.failure(new PersistenceError('Backup layer is not defined'));
  }

  public getFromCollection(
    _collectionName: string,
    _documentId: string,
    _variant: string,
  ): Outcome<Option<Document>, PersistenceError> {
    return Outcome.failure(new PersistenceError('Backup layer is not defined'));
  }

  public getFromTree(
    _treeName: string,
    _path: string[],
    _documentId: string,
    _variant: string,
  ): Outcome<Option<Document>, PersistenceError> {
    return Outcome.failure(new PersistenceError('Backup layer is not defined'));
  }

  public startTransaction(): Outcome<string, PersistenceError> {
    return Outcome.failure(new PersistenceError('Backup layer is not defined'));
  }

  public completeTransaction(_transactionId: string): Outcome<void, PersistenceError> {
    return Outcome.failure(new PersistenceError('Backup layer is not defined'));
  }

  public abortTransaction(_transactionId: string): Outcome<void, PersistenceError> {
    return Outcome.failure(new PersistenceError('Backup layer is not defined'));
  }

  public updateContentMap(
    _contentMap: ContentMap,
    _transactionId?: string,
  ): Outcome<void, PersistenceError> {
    return Outcome.failure(new PersistenceError('Backup layer is not defined'));
  }

  public putSingleton(
    _documentId: string,
    _variant: string,
    _document: Document,
    _transactionId?: string,
  ): Outcome<Document, PersistenceError> {
    return Outcome.failure(new PersistenceError('Backup layer is not defined'));
  }

  public putToCollection(
    _collectionName: string,
    _documentId: string,
    _variant: string,
    _document: Document,
    _transactionId?: string,
  ): Outcome<Document, PersistenceError> {
    return Outcome.failure(new PersistenceError('Backup layer is not defined'));
  }

  public putToTree(
    _treeName: string,
    _path: string[],
    _documentId: string,
    _variant: string,
    _document: Document,
    _transactionId?: string,
  ): Outcome<Document, PersistenceError> {
    return Outcome.failure(new PersistenceError('Backup layer is not defined'));
  }

  public deleteSingleton(
    _documentId: string,
    _variant: string,
    _transactionId?: string,
  ): Outcome<Option<Document>, PersistenceError> {
    return Outcome.failure(new PersistenceError('Backup layer is not defined'));
  }

  public deleteFromCollection(
    _collectionName: string,
    _documentId: string,
    _variant: string,
    _transactionId?: string,
  ): Outcome<Option<Document>, PersistenceError> {
    return Outcome.failure(new PersistenceError('Backup layer is not defined'));
  }

  public deleteFromTree(
    _treeName: string,
    _path: string[],
    _documentId: string,
    _variant: string,
    _transactionId?: string,
  ): Outcome<Option<Document>, PersistenceError> {
    return Outcome.failure(new PersistenceError('Backup layer is not defined'));
  }
}
