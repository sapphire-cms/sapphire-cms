import * as path from 'path';
import {promises as fs} from 'fs';
import {NodeModuleParams} from './node.module';
import {ContentSchema, Document, DocumentInfo, PersistenceLayer} from '@sapphire-cms/core';
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

  public async listSingleton(documentId: string): Promise<DocumentInfo[]> {
    const singletonFolder = path.join(this.singletonsDir, documentId);
    const variants = await this.variantsFromFolder(singletonFolder);

    return [{
      store: documentId,
      path: [],
      variants,
    }];
  }

  public async listAllFromCollection(collectionName: string): Promise<DocumentInfo[]> {
    const collectionFolder = path.join(this.collectionsDir, collectionName);
    const entries = await fs.readdir(collectionFolder, { withFileTypes: true });
    const collectionElemFolders = entries.filter(entry => entry.isDirectory());

    const docs: DocumentInfo[] = [];

    for (const elemFolder of collectionElemFolders) {
      const subPath = path.join(collectionFolder, elemFolder.name);
      const variants = await this.variantsFromFolder(subPath);

      if (variants.length) {
        docs.push({
          store: collectionName,
          path: [],
          docId: elemFolder.name,
          variants,
        });
      }
    }

    return docs;
  }

  public async listAllFromTree(treeName: string): Promise<DocumentInfo[]> {
    const treeRoot = path.join(this.treesDir, treeName);
    const entries = await fs.readdir(treeRoot, { withFileTypes: true });
    const treeFolders = entries.filter(entry => entry.isDirectory());

    const docs: DocumentInfo[] = [];

    for (const treeFolder of treeFolders) {
      const subdir = path.join(treeRoot, treeFolder.name);
      const foundDocs = await this.listFromDir(treeName, subdir, [ treeFolder.name ]);
      docs.push(...foundDocs);
    }

    return docs;
  }

  private async listFromDir(treeName: string, rootDir: string, treePath: string[]): Promise<DocumentInfo[]> {
    const entries = await fs.readdir(rootDir, { withFileTypes: true });
    const files = entries.filter(entry => entry.isFile());
    const dirs = entries.filter(entry => entry.isDirectory());

    const docs: DocumentInfo[] = [];

    if (files.length) {
      const variants = await this.variantsFromFolder(rootDir);
      docs.push({
        store: treeName,
        path: treePath.slice(0, treePath.length - 1),
        docId: treePath[treePath.length - 1],
        variants,
      });
    }

    for (const dir of dirs) {
      const subdir = path.join(rootDir, dir.name);
      const foundDocs = await this.listFromDir(treeName, subdir, [ ...treePath, dir.name ]);
      docs.push(...foundDocs);
    }

    return docs;
  }

  public async getSingleton(documentId: string, variant: string): Promise<Document<any> | undefined> {
    const filename = this.singletonFilename(documentId, variant);
    return this.loadDocument(filename);
  }

  public async getFromCollection(collectionName: string, documentId: string, variant: string): Promise<Document<any> | undefined> {
    const filename = this.collectionElemFilename(collectionName, documentId, variant);
    return this.loadDocument(filename);
  }

  public getFromTree(treeName: string, treePath: string[], documentId: string, variant: string): Promise<Document<any> | undefined> {
    const filename = this.treeLeafFilename(treeName, treePath, documentId, variant);
    return this.loadDocument(filename);
  }

  public async putSingleton(documentId: string, variant: string, document: Document<any>): Promise<Document<any>> {
    const filename = this.singletonFilename(documentId, variant);
    document.createdBy = `node@0.0.0`;
    await writeFileSafeDir(filename, JSON.stringify(document));
    return document;
  }

  public async putToCollection(collectionName: string, documentId: string, variant: string, document: Document<any>): Promise<Document<any>> {
    const filename = this.collectionElemFilename(collectionName, documentId, variant);
    document.createdBy = `node@0.0.0`;
    await writeFileSafeDir(filename, JSON.stringify(document));
    return document;
  }

  public async putToTree(treeName: string, treePath: string[], documentId: string, variant: string, document: Document<any>): Promise<Document<any>> {
    const filename = this.treeLeafFilename(treeName, treePath, documentId, variant);
    document.createdBy = `node@0.0.0`;
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

  private singletonFilename(documentId: string, variant: string): string {
    return path.join(this.singletonsDir, documentId, `${variant}.json`);
  }

  private collectionElemFilename(collectionName: string, documentId: string, variant: string): string {
    return path.join(this.collectionsDir, collectionName, documentId, `${variant}.json`);
  }

  private treeLeafFilename(treeName: string, treePath: string[], documentId: string, variant: string): string {
    return path.join(this.treesDir, treeName, ...treePath, documentId, `${variant}.json`);
  }

  private async variantsFromFolder(folder: string): Promise<string[]> {
    const entries = await fs.readdir(folder, { withFileTypes: true });
    const files = entries.filter(dirent => dirent.isFile());
    return files.map(dirent => path.parse(dirent.name).name);
  }
}
