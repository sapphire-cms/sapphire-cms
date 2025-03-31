import {PersistenceLayer} from '../persistence-layer';
import {DocumentSchema} from '../../model/document-schema';
import * as path from 'path';
import { promises as fs } from 'fs';

export default class FsPersistenceLayer implements PersistenceLayer {
  private readonly documentsDir: string;

  // TODO: should get some kind of generic config instead
  constructor(readonly root: string) {
    this.documentsDir = path.join(root, 'documents');
  }

  public prepareStore(schema: DocumentSchema): Promise<void> {
    let folder: string;

    switch (schema.type) {
      case 'singleton':
        folder = path.join(this.documentsDir, 'singletons');
        break;
      case 'collection':
        folder = path.join(this.documentsDir, 'collections', schema.name);
        break;
      case 'tree':
        folder = path.join(this.documentsDir, 'trees', schema.name);
        break;
      default:
        throw `Unknown document store type: "${schema.type}"`;
    }

    return fs.mkdir(folder, { recursive: true }).then(() => {});
  }

  public getSingleton(documentId: string): Promise<any> {
    return Promise.resolve(undefined);
  }

  public getFromCollection(collectionName: string, documentId: string): Promise<any> {
    return Promise.resolve(undefined);
  }

  public getFromTree(...path: string[]): Promise<any> {
    return Promise.resolve(undefined);
  }

  public putSingleton(documentId: string, document: any): Promise<void> {
    return Promise.resolve(undefined);
  }

  public putToCollection(collectionName: string, documentId: string, document: any): Promise<void> {
    const file = path.join(this.documentsDir, 'collections', collectionName, `${documentId}.json`);
    return fs.writeFile(file, JSON.stringify(document));
  }

  public putToTree(path: string[], document: any): Promise<void> {
    return Promise.resolve(undefined);
  }
}
