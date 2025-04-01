import * as path from 'path';
import { promises as fs } from 'fs';
import {FsModuleParams} from './fs.module';
import {ContentSchema, ContentType} from '@sapphire-cms/core/dist/model/content-schema';
import {PersistenceLayer} from '@sapphire-cms/core/dist/layers/persistence.layer';

export default class FsPersistenceLayer implements PersistenceLayer<FsModuleParams> {
  private readonly documentsDir: string;

  constructor(readonly params: FsModuleParams) {
    this.documentsDir = path.join(params.root, 'documents');
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
