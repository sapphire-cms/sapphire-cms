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
    const folder = path.join(this.singletonsDir, documentId);
    const entries = await fs.readdir(folder, { withFileTypes: true });
    const singletonFiles = entries.filter(dirent => dirent.isFile());
    const variants = singletonFiles.map(dirent => path.parse(dirent.name).name);

    return [{
      store: documentId,
      path: [],
      variants,
    }];

    // const docs: DocumentInfo[] = [];
    //
    // for (const singletonFolder of singletonFolders) {
    //   const subPath = path.join(this.singletonsDir, singletonFolder.name);
    //   const inner = await fs.readdir(subPath, { withFileTypes: true });
    //   const singletonFiles = inner.filter(dirent => dirent.isFile());
    //   const variants = singletonFiles.map(dirent => path.parse(dirent.name).name);
    //
    //   if (variants.length) {
    //     docs.push({
    //       store: singletonFolder.name,
    //       path: [],
    //       variants
    //     });
    //   }
    // }
    //
    // return docs;
  }

  public async listAllFromCollection(collectionName: string): Promise<DocumentInfo[]> {
    const folder = path.join(this.collectionsDir, collectionName);
    const entries = await fs.readdir(folder, { withFileTypes: true });
    const collectionElems = entries.filter(entry => entry.isDirectory());

    const docs: DocumentInfo[] = [];

    for (const elemFolder of collectionElems) {
      const subPath = path.join(folder, elemFolder.name);
      const inner = await fs.readdir(subPath, { withFileTypes: true });
      const elemFiles = inner.filter(dirent => dirent.isFile());
      const variants = elemFiles.map(dirent => path.parse(dirent.name).name);

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

  public listAllFromTree(treeName: string): Promise<DocumentInfo[]> {
    // TODO: code this method
    return Promise.resolve([]);
  }


  public async listIdsSingletons(): Promise<string[]> {
    const entries = await fs.readdir(this.singletonsDir, { withFileTypes: true });
    const subfolders = entries.filter(dirent => dirent.isDirectory());

    const foldersWithFiles: string[] = [];

    for (const sub of subfolders) {
      const subPath = path.join(this.singletonsDir, sub.name);
      const inner = await fs.readdir(subPath, { withFileTypes: true });

      const hasFiles = inner.some(dirent => dirent.isFile());
      if (hasFiles) {
        foldersWithFiles.push(sub.name);
      }
    }

    return foldersWithFiles;
  }

  public async listIdsCollection(collectionName: string): Promise<string[]> {
    const folder = path.join(this.collectionsDir, collectionName);
    const entries = await fs.readdir(folder, { withFileTypes: true });
    return entries
        .filter(entry => entry.isDirectory())
        .map(entry => entry.name);
  }

  public listIdsTree(treeName: string): Promise<string[]> {
    // TODO: code this method
    return Promise.resolve([]);
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
    await writeFileSafeDir(filename, JSON.stringify(document));
    return document;
  }

  public async putToCollection(collectionName: string, documentId: string, variant: string, document: Document<any>): Promise<Document<any>> {
    const filename = this.collectionElemFilename(collectionName, documentId, variant);
    await writeFileSafeDir(filename, JSON.stringify(document));
    return document;
  }

  public async putToTree(treeName: string, treePath: string[], documentId: string, variant: string, document: Document<any>): Promise<Document<any>> {
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

  private singletonFilename(documentId: string, variant: string): string {
    return path.join(this.singletonsDir, documentId, `${variant}.json`);
  }

  private collectionElemFilename(collectionName: string, documentId: string, variant: string): string {
    return path.join(this.collectionsDir, collectionName, documentId, `${variant}.json`);
  }

  private treeLeafFilename(treeName: string, treePath: string[], documentId: string, variant: string): string {
    return path.join(this.treesDir, treeName, ...treePath, documentId, `${variant}.json`);
  }
}
