import { promises as fs } from 'fs';
import * as path from 'path';
import {
  ContentMap,
  ContentSchema,
  Document,
  DocumentInfo,
  Option,
  PersistenceError,
  PersistenceLayer,
} from '@sapphire-cms/core';
import { okAsync, ResultAsync } from 'neverthrow';
import { fileExists, isDirectoryEmpty, writeFileSafeDir } from '../utils';
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

  public prepareSingletonRepo(schema: ContentSchema): ResultAsync<void, PersistenceError> {
    const folder = path.join(this.singletonsDir, schema.name);
    return ResultAsync.fromPromise(
      this.createFolder(folder),
      (err) => new PersistenceError('Error during singleton repo creation', err),
    );
  }

  public prepareCollectionRepo(schema: ContentSchema): ResultAsync<void, PersistenceError> {
    const folder = path.join(this.collectionsDir, schema.name);
    return ResultAsync.fromPromise(
      this.createFolder(folder),
      (err) => new PersistenceError('Error during collection repo creation', err),
    );
  }

  public prepareTreeRepo(schema: ContentSchema): ResultAsync<void, PersistenceError> {
    const folder = path.join(this.treesDir, schema.name);
    return ResultAsync.fromPromise(
      this.createFolder(folder),
      (err) => new PersistenceError('Error during tree repo creation', err),
    );
  }

  public getContentMap(): ResultAsync<Option<ContentMap>, PersistenceError> {
    return ResultAsync.fromPromise(
      fileExists(this.workPaths.contentMapFile),
      (err) =>
        new PersistenceError(
          `Failed to check existence of file: "${this.workPaths.contentMapFile}}"`,
          err,
        ),
    ).andThen((exists) => {
      if (!exists) {
        return okAsync(Option.none());
      }

      return ResultAsync.fromPromise(
        fs.readFile(this.workPaths.contentMapFile, 'utf-8'),
        (err) =>
          new PersistenceError(
            `Failed to read content map file: "${this.workPaths.contentMapFile}}"`,
            err,
          ),
      ).andThen((fileContent) => {
        return ResultAsync.fromPromise<Option<ContentMap>, PersistenceError>(
          new Promise((resolve) => {
            const contentMap = JSON.parse(fileContent) as ContentMap;
            resolve(Option.some(contentMap));
          }),
          (parseErr) => new PersistenceError('Failed to parse content map JSON', parseErr),
        );
      });
    });
  }

  public updateContentMap(contentMap: ContentMap): ResultAsync<void, PersistenceError> {
    return ResultAsync.fromPromise(
      fs.writeFile(this.workPaths.contentMapFile, JSON.stringify(contentMap), 'utf-8'),
      (err) => new PersistenceError('Failed to update content map', err),
    );
  }

  public listSingleton(documentId: string): ResultAsync<DocumentInfo[], PersistenceError> {
    const singletonFolder = path.join(this.singletonsDir, documentId);

    return ResultAsync.fromPromise(
      this.variantsFromFolder(singletonFolder),
      (err) => new PersistenceError(`Failed to find variants for document ${documentId}`, err),
    ).map((variants) => {
      return [
        {
          store: documentId,
          path: [],
          variants,
        },
      ];
    });
  }

  public listAllFromCollection(
    collectionName: string,
  ): ResultAsync<DocumentInfo[], PersistenceError> {
    const collectionFolder = path.join(this.collectionsDir, collectionName);

    return ResultAsync.fromPromise(
      fs.readdir(collectionFolder, { withFileTypes: true }),
      (err) =>
        new PersistenceError(`Cannot read entries of the directory ${collectionFolder}`, err),
    ).andThen((entries) => {
      const collectionElemFolders = entries.filter((entry) => entry.isDirectory());

      const tasks: ResultAsync<DocumentInfo | null, PersistenceError>[] = collectionElemFolders.map(
        (elemFolder) => {
          const subPath = path.join(collectionFolder, elemFolder.name);

          return ResultAsync.fromPromise(
            this.variantsFromFolder(subPath),
            (err) => new PersistenceError(`Failed to read variants in "${subPath}"`, err),
          ).map<DocumentInfo | null>((variants) => {
            if (!variants.length) {
              return null;
            }

            return {
              store: collectionName,
              path: [],
              docId: elemFolder.name,
              variants,
            } satisfies DocumentInfo;
          });
        },
      );

      return ResultAsync.combine(tasks).map((results) =>
        results.filter((doc): doc is DocumentInfo => doc !== null),
      );
    });
  }

  public listAllFromTree(treeName: string): ResultAsync<DocumentInfo[], PersistenceError> {
    const treeRoot = path.join(this.treesDir, treeName);

    return ResultAsync.fromPromise(
      fs.readdir(treeRoot, { withFileTypes: true }),
      (err) => new PersistenceError(`Cannot read entries of the directory ${treeRoot}`, err),
    ).andThen((entries) => {
      const treeFolders = entries.filter((entry) => entry.isDirectory());

      const tasks: ResultAsync<DocumentInfo[], PersistenceError>[] = treeFolders.map(
        (treeFolder) => {
          const subdir = path.join(treeRoot, treeFolder.name);
          return ResultAsync.fromPromise(
            this.listFromDir(treeName, subdir, [treeFolder.name]),
            (err) => new PersistenceError(`Failed to read documents from "${subdir}"`, err),
          );
        },
      );

      return ResultAsync.combine(tasks).map((docArrays) => docArrays.flat());
    });
  }

  private async listFromDir(
    treeName: string,
    rootDir: string,
    treePath: string[],
  ): Promise<DocumentInfo[]> {
    const entries = await fs.readdir(rootDir, { withFileTypes: true });
    const files = entries.filter((entry) => entry.isFile());
    const dirs = entries.filter((entry) => entry.isDirectory());

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
      const foundDocs = await this.listFromDir(treeName, subdir, [...treePath, dir.name]);
      docs.push(...foundDocs);
    }

    return docs;
  }

  public getSingleton(
    documentId: string,
    variant: string,
  ): ResultAsync<Option<Document>, PersistenceError> {
    const filename = this.singletonFilename(documentId, variant);
    return ResultAsync.fromPromise(
      this.loadDocument(filename),
      (err) => new PersistenceError(`Failed to read document from file ${filename}`, err),
    ).map((doc) => Option.fromNullable(doc));
  }

  public getFromCollection(
    collectionName: string,
    documentId: string,
    variant: string,
  ): ResultAsync<Option<Document>, PersistenceError> {
    const filename = this.collectionElemFilename(collectionName, documentId, variant);
    return ResultAsync.fromPromise(
      this.loadDocument(filename),
      (err) => new PersistenceError(`Failed to read document from file ${filename}`, err),
    ).map((doc) => Option.fromNullable(doc));
  }

  public getFromTree(
    treeName: string,
    treePath: string[],
    documentId: string,
    variant: string,
  ): ResultAsync<Option<Document>, PersistenceError> {
    const filename = this.treeLeafFilename(treeName, treePath, documentId, variant);
    return ResultAsync.fromPromise(
      this.loadDocument(filename),
      (err) => new PersistenceError(`Failed to read document from file ${filename}`, err),
    ).map((doc) => Option.fromNullable(doc));
  }

  public putSingleton(
    documentId: string,
    variant: string,
    document: Document,
  ): ResultAsync<Document, PersistenceError> {
    const filename = this.singletonFilename(documentId, variant);
    document.createdBy = `node@0.0.0`;

    return ResultAsync.fromPromise(
      writeFileSafeDir(filename, JSON.stringify(document)),
      (err) => new PersistenceError(`Failed to write document in the file ${filename}`, err),
    ).map(() => document);
  }

  public putToCollection(
    collectionName: string,
    documentId: string,
    variant: string,
    document: Document,
  ): ResultAsync<Document, PersistenceError> {
    const filename = this.collectionElemFilename(collectionName, documentId, variant);
    document.createdBy = `node@0.0.0`;

    return ResultAsync.fromPromise(
      writeFileSafeDir(filename, JSON.stringify(document)),
      (err) => new PersistenceError(`Failed to write document in the file ${filename}`, err),
    ).map(() => document);
  }

  public putToTree(
    treeName: string,
    treePath: string[],
    documentId: string,
    variant: string,
    document: Document,
  ): ResultAsync<Document, PersistenceError> {
    const filename = this.treeLeafFilename(treeName, treePath, documentId, variant);
    document.createdBy = `node@0.0.0`;

    return ResultAsync.fromPromise(
      writeFileSafeDir(filename, JSON.stringify(document)),
      (err) => new PersistenceError(`Failed to write document in the file ${filename}`, err),
    ).map(() => document);
  }

  public deleteSingleton(
    documentId: string,
    variant: string,
  ): ResultAsync<Option<Document>, PersistenceError> {
    const filename = this.singletonFilename(documentId, variant);

    return ResultAsync.fromPromise(
      this.loadDocument(filename),
      (err) => new PersistenceError(`Failed to read document from file ${filename}`, err),
    ).andThen((doc) => {
      if (!doc) {
        return okAsync(Option.none());
      }

      return ResultAsync.fromPromise(
        fs.rm(filename),
        (err) => new PersistenceError(`Failed to remove file ${filename}`, err),
      ).map(() => Option.some(doc));
    });
  }

  public deleteFromCollection(
    collectionName: string,
    documentId: string,
    variant: string,
  ): ResultAsync<Option<Document>, PersistenceError> {
    const filename = this.collectionElemFilename(collectionName, documentId, variant);
    const documentDir = path.dirname(filename);

    return ResultAsync.fromPromise(
      this.loadDocument(filename),
      (err) => new PersistenceError(`Failed to read document from file ${filename}`, err),
    ).andThen((doc) => {
      if (!doc) {
        return okAsync(Option.none());
      }

      return ResultAsync.fromPromise(
        fs.rm(filename),
        (err) => new PersistenceError(`Failed to remove file: ${filename}`, err),
      )
        .andThen(() =>
          ResultAsync.fromPromise(
            isDirectoryEmpty(documentDir),
            (err) => new PersistenceError(`Failed to check directory: ${documentDir}`, err),
          ),
        )
        .andThen((isEmpty) => {
          if (!isEmpty) return okAsync(undefined);
          return ResultAsync.fromPromise(
            fs.rmdir(documentDir),
            (err) => new PersistenceError(`Failed to remove empty directory: ${documentDir}`, err),
          );
        })
        .map(() => Option.some(doc));
    });
  }

  public deleteFromTree(
    treeName: string,
    treePath: string[],
    documentId: string,
    variant: string,
  ): ResultAsync<Option<Document>, PersistenceError> {
    const filename = this.treeLeafFilename(treeName, treePath, documentId, variant);
    const documentDir = path.dirname(filename);

    return ResultAsync.fromPromise(
      this.loadDocument(filename),
      (err) => new PersistenceError(`Failed to read document from file ${filename}`, err),
    ).andThen((doc) => {
      if (!doc) {
        return okAsync(Option.none());
      }

      return ResultAsync.fromPromise(
        fs.rm(filename),
        (err) => new PersistenceError(`Failed to remove file: ${filename}`, err),
      )
        .andThen(() =>
          ResultAsync.fromPromise(
            isDirectoryEmpty(documentDir),
            (err) => new PersistenceError(`Failed to check directory: ${documentDir}`, err),
          ),
        )
        .andThen((isEmpty) => {
          if (!isEmpty) return okAsync(undefined);
          return ResultAsync.fromPromise(
            fs.rmdir(documentDir),
            (err) => new PersistenceError(`Failed to remove empty directory: ${documentDir}`, err),
          );
        })
        .map(() => Option.some(doc));
    });
  }

  private createFolder(folder: string): Promise<void> {
    return fs.mkdir(folder, { recursive: true }).then(() => {});
  }

  private async loadDocument(filename: string): Promise<Document | undefined> {
    if (await fileExists(filename)) {
      const raw = await fs.readFile(filename, 'utf-8');
      return JSON.parse(raw) as Document;
    } else {
      return undefined;
    }
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

  private async variantsFromFolder(folder: string): Promise<string[]> {
    const entries = await fs.readdir(folder, { withFileTypes: true });
    const files = entries.filter((dirent) => dirent.isFile());
    return files.map((dirent) => path.parse(dirent.name).name);
  }
}
