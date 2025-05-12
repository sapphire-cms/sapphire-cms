import { Dirent } from 'fs';
import * as path from 'path';
import {
  AsyncProgram,
  asyncProgram,
  ContentMap,
  ContentSchema,
  Document,
  DocumentInfo,
  Option,
  PersistenceError,
  PersistenceLayer,
  failure,
  Outcome,
} from '@sapphire-cms/core';
import {
  ensureDirectory,
  fileExists,
  FsError,
  isDirectoryEmpty,
  JsonParsingError,
  listDirectoryEntries,
  loadJson,
  rmDirectory,
  rmFile,
  writeFileSafeDir,
} from '../common';
import { NodeModuleParams } from './node.module';
import { resolveWorkPaths, WorkPaths } from './params-utils';

export default class NodePersistenceLayer implements PersistenceLayer<NodeModuleParams> {
  private readonly workPaths: WorkPaths;
  private readonly singletonsDir: string;
  private readonly collectionsDir: string;
  private readonly treesDir: string;

  constructor(params: NodeModuleParams) {
    this.workPaths = resolveWorkPaths(params);
    this.singletonsDir = path.join(this.workPaths.documentsDir, 'singletons');
    this.collectionsDir = path.join(this.workPaths.documentsDir, 'collections');
    this.treesDir = path.join(this.workPaths.documentsDir, 'trees');
  }

  public prepareSingletonRepo(schema: ContentSchema): Outcome<void, PersistenceError> {
    const folder = path.join(this.singletonsDir, schema.name);
    return ensureDirectory(folder)
      .map(() => {})
      .mapFailure(
        (fsError) =>
          new PersistenceError(`Failed to create singleton repo ${schema.name}`, fsError),
      );
  }

  public prepareCollectionRepo(schema: ContentSchema): Outcome<void, PersistenceError> {
    const folder = path.join(this.collectionsDir, schema.name);
    return ensureDirectory(folder)
      .map(() => {})
      .mapFailure(
        (fsError) =>
          new PersistenceError(`Failed to create collection repo ${schema.name}`, fsError),
      );
  }

  public prepareTreeRepo(schema: ContentSchema): Outcome<void, PersistenceError> {
    const folder = path.join(this.treesDir, schema.name);
    return ensureDirectory(folder)
      .map(() => {})
      .mapFailure(
        (fsError) => new PersistenceError(`Failed to create tree repo ${schema.name}`, fsError),
      );
  }

  public getContentMap(): Outcome<Option<ContentMap>, PersistenceError> {
    return asyncProgram(
      function* (): AsyncProgram<Option<ContentMap>, JsonParsingError | FsError> {
        if (yield fileExists(this.workPaths.contentMapFile)) {
          const contentMap: ContentMap = yield loadJson(this.workPaths.contentMapFile);
          return Option.some(contentMap);
        } else {
          return Option.none();
        }
      },
      (defect) => failure(new FsError('Defective prepareTreeRepo program', defect)),
      this,
    ).mapFailure((fsError) => fsError.wrapIn(PersistenceError));
  }

  public updateContentMap(contentMap: ContentMap): Outcome<void, PersistenceError> {
    return writeFileSafeDir(this.workPaths.contentMapFile, JSON.stringify(contentMap)).mapFailure(
      (fsError) => fsError.wrapIn(PersistenceError),
    );
  }

  public listSingleton(documentId: string): Outcome<DocumentInfo[], PersistenceError> {
    const singletonFolder = path.join(this.singletonsDir, documentId);

    return this.variantsFromFolder(singletonFolder)
      .map((variants) => {
        return [
          {
            store: documentId,
            path: [],
            variants,
          },
        ];
      })
      .mapFailure((fsError) => fsError.wrapIn(PersistenceError));
  }

  public listAllFromCollection(collectionName: string): Outcome<DocumentInfo[], PersistenceError> {
    const collectionFolder = path.join(this.collectionsDir, collectionName);

    return asyncProgram(
      function* (): AsyncProgram<DocumentInfo[], FsError> {
        const entries: Dirent[] = yield listDirectoryEntries(collectionFolder);
        const collectionElemFolders = entries.filter((entry) => entry.isDirectory());

        const docs: DocumentInfo[] = [];

        for (const elemFolder of collectionElemFolders) {
          const subPath = path.join(collectionFolder, elemFolder.name);
          const variants = yield this.variantsFromFolder(subPath);

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
      },
      (defect) => failure(new FsError('Defective listAllFromCollection program', defect)),
      this,
    ).mapFailure((err) => err.wrapIn(PersistenceError));
  }

  public listAllFromTree(treeName: string): Outcome<DocumentInfo[], PersistenceError> {
    const treeRoot = path.join(this.treesDir, treeName);

    return asyncProgram(
      function* (): AsyncProgram<DocumentInfo[], FsError> {
        const entries: Dirent[] = yield listDirectoryEntries(treeRoot);
        const treeFolders = entries.filter((entry) => entry.isDirectory());

        const docs: DocumentInfo[] = [];

        for (const treeFolder of treeFolders) {
          const subdir = path.join(treeRoot, treeFolder.name);
          const foundDocs = yield this.listFromDir(treeName, subdir, [treeFolder.name]);
          docs.push(...foundDocs);
        }

        return docs;
      },
      (defect) => failure(new FsError('Defective listAllFromCollection program', defect)),
      this,
    ).mapFailure((err) => err.wrapIn(PersistenceError));
  }

  public getSingleton(
    documentId: string,
    variant: string,
  ): Outcome<Option<Document>, PersistenceError> {
    const filename = this.singletonFilename(documentId, variant);
    return this.loadDocument(filename).mapFailure((err) => err.wrapIn(PersistenceError));
  }

  public getFromCollection(
    collectionName: string,
    documentId: string,
    variant: string,
  ): Outcome<Option<Document>, PersistenceError> {
    const filename = this.collectionElemFilename(collectionName, documentId, variant);
    return this.loadDocument(filename).mapFailure((err) => err.wrapIn(PersistenceError));
  }

  public getFromTree(
    treeName: string,
    treePath: string[],
    documentId: string,
    variant: string,
  ): Outcome<Option<Document>, PersistenceError> {
    const filename = this.treeLeafFilename(treeName, treePath, documentId, variant);
    return this.loadDocument(filename).mapFailure((err) => err.wrapIn(PersistenceError));
  }

  public putSingleton(
    documentId: string,
    variant: string,
    document: Document,
  ): Outcome<Document, PersistenceError> {
    const filename = this.singletonFilename(documentId, variant);
    document.createdBy = `node@0.0.0`;

    return writeFileSafeDir(filename, JSON.stringify(document))
      .map(() => document)
      .mapFailure((fsError) => fsError.wrapIn(PersistenceError));
  }

  public putToCollection(
    collectionName: string,
    documentId: string,
    variant: string,
    document: Document,
  ): Outcome<Document, PersistenceError> {
    const filename = this.collectionElemFilename(collectionName, documentId, variant);
    document.createdBy = `node@0.0.0`;

    return writeFileSafeDir(filename, JSON.stringify(document))
      .map(() => document)
      .mapFailure((fsError) => fsError.wrapIn(PersistenceError));
  }

  public putToTree(
    treeName: string,
    treePath: string[],
    documentId: string,
    variant: string,
    document: Document,
  ): Outcome<Document, PersistenceError> {
    const filename = this.treeLeafFilename(treeName, treePath, documentId, variant);
    document.createdBy = `node@0.0.0`;

    return writeFileSafeDir(filename, JSON.stringify(document))
      .map(() => document)
      .mapFailure((fsError) => fsError.wrapIn(PersistenceError));
  }

  public deleteSingleton(
    documentId: string,
    variant: string,
  ): Outcome<Option<Document>, PersistenceError> {
    const filename = this.singletonFilename(documentId, variant);

    return this.loadDocument(filename)
      .through(() => rmFile(filename))
      .mapFailure((err) => err.wrapIn(PersistenceError));
  }

  public deleteFromCollection(
    collectionName: string,
    documentId: string,
    variant: string,
  ): Outcome<Option<Document>, PersistenceError> {
    const filename = this.collectionElemFilename(collectionName, documentId, variant);
    const documentDir = path.dirname(filename);

    return asyncProgram(
      function* (): AsyncProgram<Option<Document>, JsonParsingError | FsError> {
        const doc = yield this.loadDocument(filename);

        yield rmFile(filename);

        if (yield isDirectoryEmpty(documentDir)) {
          yield rmDirectory(documentDir);
        }

        return doc;
      },
      (defect) => failure(new FsError('Defective renderDocument program', defect)),
      this,
    ).mapFailure((err) => err.wrapIn(PersistenceError));
  }

  public deleteFromTree(
    treeName: string,
    treePath: string[],
    documentId: string,
    variant: string,
  ): Outcome<Option<Document>, PersistenceError> {
    const filename = this.treeLeafFilename(treeName, treePath, documentId, variant);
    const documentDir = path.dirname(filename);

    return asyncProgram(
      function* (): AsyncProgram<Option<Document>, JsonParsingError | FsError> {
        const doc = yield this.loadDocument(filename);

        yield rmFile(filename);

        if (yield isDirectoryEmpty(documentDir)) {
          yield rmDirectory(documentDir);
        }

        return doc;
      },
      (defect) => failure(new FsError('Defective renderDocument program', defect)),
      this,
    ).mapFailure((err) => err.wrapIn(PersistenceError));
  }

  private listFromDir(
    treeName: string,
    rootDir: string,
    treePath: string[],
  ): Outcome<DocumentInfo[], FsError> {
    return asyncProgram(
      function* (): AsyncProgram<DocumentInfo[], FsError> {
        const entries: Dirent[] = yield listDirectoryEntries(rootDir);
        const files = entries.filter((entry) => entry.isFile());
        const dirs = entries.filter((entry) => entry.isDirectory());

        const docs: DocumentInfo[] = [];

        if (files.length) {
          const variants = yield this.variantsFromFolder(rootDir);
          docs.push({
            store: treeName,
            path: treePath.slice(0, treePath.length - 1),
            docId: treePath[treePath.length - 1],
            variants,
          });
        }

        for (const dir of dirs) {
          const subdir = path.join(rootDir, dir.name);
          const foundDocs = yield this.listFromDir(treeName, subdir, [...treePath, dir.name]);
          docs.push(...foundDocs);
        }

        return docs;
      },
      (defect) => failure(new FsError('Defective listFromDir program', defect)),
      this,
    );
  }

  private loadDocument(filename: string): Outcome<Option<Document>, FsError | JsonParsingError> {
    return asyncProgram(
      function* (): AsyncProgram<Option<Document>, FsError | JsonParsingError> {
        if (yield fileExists(filename)) {
          return loadJson<Document>(filename).map((content) => Option.some(content));
        } else {
          return Option.none();
        }
      },
      (defect) => failure(new FsError('Defective variantsFromFolder program', defect)),
    );
  }

  private singletonFilename(documentId: string, variant: string): string {
    return path.join(this.singletonsDir, documentId, `${variant}.json`);
  }

  private collectionElemFilename(
    collectionName: string,
    documentId: string,
    variant: string,
  ): string {
    return path.join(this.collectionsDir, collectionName, documentId, `${variant}.json`);
  }

  private treeLeafFilename(
    treeName: string,
    treePath: string[],
    documentId: string,
    variant: string,
  ): string {
    return path.join(this.treesDir, treeName, ...treePath, documentId, `${variant}.json`);
  }

  private variantsFromFolder(folder: string): Outcome<string[], FsError> {
    return asyncProgram(
      function* (): AsyncProgram<string[], FsError> {
        const entries: Dirent[] = yield listDirectoryEntries(folder);
        const files = entries.filter((dirent) => dirent.isFile());
        return files.map((dirent) => path.parse(dirent.name).name);
      },
      (defect) => failure(new FsError('Defective variantsFromFolder program', defect)),
    );
  }
}
