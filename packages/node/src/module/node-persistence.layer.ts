import * as path from 'path';
import { promises as fs } from 'fs';
import {NodeModuleParams} from './node.module';
import {ContentSchema, ContentType, PersistenceLayer} from '@sapphire-cms/core';

export default class NodePersistenceLayer implements PersistenceLayer<NodeModuleParams> {
  private readonly documentsDir: string;

  constructor(readonly params: NodeModuleParams) {
    this.documentsDir = path.join(params.dataDir, 'documents');
  }

  public prepareStore(schema: ContentSchema): Promise<void> {
    let folder: string;

    switch (schema.type) {
      case ContentType.SINGLETON:
        folder = path.join(this.documentsDir, 'singletons');
        break;
      case ContentType.COLLECTION:
        folder = path.join(this.documentsDir, 'collections', schema.name);
        break;
      case ContentType.TREE:
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
    const file = path.join(this.documentsDir, 'singletons', `${documentId}.json`);
    return fs.writeFile(file, JSON.stringify(document));
  }

  public putToCollection(collectionName: string, documentId: string, document: any): Promise<void> {
    const file = path.join(this.documentsDir, 'collections', collectionName, `${documentId}.json`);
    return fs.writeFile(file, JSON.stringify(document));
  }

  public putToTree(path: string[], document: any): Promise<void> {
    return Promise.resolve(undefined);
  }
}
