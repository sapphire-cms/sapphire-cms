import * as path from 'path';
import {promises as fs} from 'fs';
import {NodeModuleParams} from './node.module';
import {ContentSchema, Document, PersistenceLayer} from '@sapphire-cms/core';
import {resolveWorkPaths, WorkPaths} from './params-utils';
import {fileExists, writeFileSafeDir} from '../utils';

export default class NodePersistenceLayer implements PersistenceLayer<NodeModuleParams> {
  private readonly workPaths: WorkPaths;
  private readonly singletonsDir: string;
  private readonly collectionsDir: string;
  private readonly treesDir: string;

  constructor(readonly params: NodeModuleParams) {
    this.workPaths = resolveWorkPaths(params);
    this.singletonsDir = path.join(this.workPaths.documentsDir, 'singletons');
    this.collectionsDir = path.join(this.workPaths.documentsDir, 'collections');
    this.treesDir = path.join(this.workPaths.documentsDir, 'trees');
  }

  public prepareSingletonRepo(schema: ContentSchema): Promise<void> {
    const folder = path.join(this.singletonsDir, schema.name);
    return this.createFolder(folder);
  }

  public prepareCollectionRepo(schema: ContentSchema): Promise<void> {
    const folder = path.join(this.collectionsDir, schema.name);
    return this.createFolder(folder);
  }

  public prepareTreeRepo(schema: ContentSchema): Promise<void> {
    const folder = path.join(this.treesDir, schema.name);
    return this.createFolder(folder);
  }

  public async getSingleton(documentId: string, variant?: string): Promise<Document<any> | undefined> {
    const filename = this.singletonFilename(documentId, variant);
    return this.loadDocument(filename);
  }

  public async getFromCollection(collectionName: string, documentId: string, variant?: string): Promise<Document<any> | undefined> {
    const filename = this.collectionElemFilename(collectionName, documentId, variant);
    return this.loadDocument(filename);
  }

  public getFromTree(treeName: string, treePath: string[], documentId: string, variant?: string): Promise<Document<any> | undefined> {
    const filename = this.treeLeafFilename(treeName, treePath, documentId, variant);
    return this.loadDocument(filename);
  }

  public async putSingleton(documentId: string, document: Document<any>, variant?: string): Promise<Document<any>> {
    const filename = this.singletonFilename(documentId, variant);
    await writeFileSafeDir(filename, JSON.stringify(document));
    return document;
  }

  public async putToCollection(collectionName: string, documentId: string, document: Document<any>, variant?: string): Promise<Document<any>> {
    const filename = this.collectionElemFilename(collectionName, documentId, variant);
    await writeFileSafeDir(filename, JSON.stringify(document));
    return document;
  }

  public async putToTree(treeName: string, treePath: string[], documentId: string, document: Document<any>, variant?: string): Promise<Document<any>> {
    const filename = this.treeLeafFilename(treeName, treePath, documentId, variant);
    await writeFileSafeDir(filename, JSON.stringify(document));
    return document;
  }

  private createFolder(folder: string): Promise<void> {
    return fs.mkdir(folder, { recursive: true }).then(() => {});
  }

  private async loadDocument(filename: string): Promise<Document<any> | undefined> {
    if (await fileExists(filename)) {
      const raw = await fs.readFile(filename, 'utf-8');
      return JSON.parse(raw) as Document<any>;
    } else {
      return undefined;
    }
  }

  private singletonFilename(documentId: string, variant?: string): string {
    const jsonFile = variant ? `${variant}.json` : 'default.json';
    return path.join(this.singletonsDir, documentId, jsonFile);
  }

  private collectionElemFilename(collectionName: string, documentId: string, variant?: string): string {
    const jsonFile = variant ? `${variant}.json` : 'default.json';
    return path.join(this.collectionsDir, collectionName, documentId, jsonFile);
  }

  private treeLeafFilename(treeName: string, treePath: string[], documentId: string, variant?: string): string {
    const jsonFile = variant ? `${variant}.json` : 'default.json';
    return path.join(this.treesDir, treeName, ...treePath, documentId, jsonFile);
  }
}
