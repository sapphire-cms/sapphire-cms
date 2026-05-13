import { Outcome, Program, program } from 'defectless';
import { inject, singleton } from 'tsyringe';
import { deepClone, Some } from '../common';
import { DI_TOKENS, PersistenceError, PlatformError, TaskState, TaskStatus } from '../kernel';
import { AdminLayer, DocsCopyMetadata, PersistenceLayer, PlatformLayer } from '../layers';
import {
  ContentType,
  Document,
  DocumentInfo,
  MissingDocIdError,
  UnknownContentTypeError,
  UnsupportedContentVariant,
} from '../model';
import { CmsContext } from './cms-context';
import { SecureAdminLayer } from './secure-admin.layer';

@singleton()
export class BackupService {
  constructor(
    @inject(CmsContext) private readonly cmsContext: CmsContext,
    @inject(SecureAdminLayer) private readonly adminLayer: AdminLayer,
    @inject(DI_TOKENS.PersistenceLayer) private readonly persistenceLayer: PersistenceLayer,
    @inject(DI_TOKENS.BackupLayer) private readonly backupLayer: PersistenceLayer,
    @inject(DI_TOKENS.PlatformLayer) private readonly platformLayer: PlatformLayer,
  ) {
    this.adminLayer.startBackupTaskPort.accept(() => {
      return this.backup().map(deepClone);
    });

    this.adminLayer.startRestoreTaskPort.accept(() => {
      return this.restore().map(deepClone);
    });

    this.adminLayer.taskStatusPort.accept((taskId: string) => {
      return this.platformLayer.taskStatus<DocsCopyMetadata>(taskId).map(deepClone);
    });

    this.adminLayer.abortTaskPort.accept((taskId: string) => {
      return this.platformLayer.abortTask<DocsCopyMetadata>(taskId).map(deepClone);
    });
  }

  public backup(): Outcome<TaskState<DocsCopyMetadata>, PlatformError> {
    return this.platformLayer.startTask((taskState: TaskState<DocsCopyMetadata>) => {
      return this.copyDocuments(this.persistenceLayer, this.backupLayer, taskState);
    });
  }

  public restore(): Outcome<TaskState<DocsCopyMetadata>, PlatformError> {
    return this.platformLayer.startTask((taskState: TaskState<DocsCopyMetadata>) => {
      return this.copyDocuments(this.backupLayer, this.persistenceLayer, taskState);
    });
  }

  private copyDocuments(
    source: PersistenceLayer,
    target: PersistenceLayer,
    taskState: TaskState<DocsCopyMetadata>,
  ): Outcome<
    void,
    UnknownContentTypeError | UnsupportedContentVariant | MissingDocIdError | PersistenceError
  > {
    const allSchemas = new Map([
      ...this.cmsContext.publicHydratedContentSchemas,
      ...this.cmsContext.hiddenHydratedContentSchemas,
    ]);
    const allDocs: DocumentInfo[] = [];

    return program(function* (): Program<
      void,
      UnknownContentTypeError | UnsupportedContentVariant | MissingDocIdError | PersistenceError
    > {
      for (const schema of allSchemas.values()) {
        let storeDocs: DocumentInfo[];

        switch (schema.type) {
          case ContentType.SINGLETON:
            storeDocs = yield source.listSingleton(schema.name);
            break;
          case ContentType.COLLECTION:
            storeDocs = yield source.listAllFromCollection(schema.name);
            break;
          case ContentType.TREE:
            storeDocs = yield source.listAllFromTree(schema.name);
            break;
        }

        allDocs.push(...storeDocs);
      }

      taskState.metadata = {
        totalDocsCount: allDocs.length,
        copiedDocsCount: 0,
      };

      // Copy documents
      for (const doc of allDocs) {
        if (taskState.status === TaskStatus.aborted) {
          break;
        }

        const schema = allSchemas.get(doc.store);
        for (const variant of doc.variants) {
          let document: Some<Document>;

          switch (schema!.type) {
            case ContentType.SINGLETON:
              document = (yield source.getSingleton(doc.store, variant)) as Some<Document>;
              yield target.putSingleton(doc.store, variant, document.value);
              break;
            case ContentType.COLLECTION:
              document = (yield source.getFromCollection(
                doc.store,
                doc.docId!,
                variant,
              )) as Some<Document>;
              yield target.putToCollection(doc.store, doc.docId!, variant, document.value);
              break;
            case ContentType.TREE:
              document = (yield source.getFromTree(
                doc.store,
                doc.path,
                doc.docId!,
                variant,
              )) as Some<Document>;
              yield target.putToTree(doc.store, doc.path, doc.docId!, variant, document.value);
              break;
          }
        }

        taskState.metadata!.copiedDocsCount++;
        taskState.progress = taskState.metadata!.copiedDocsCount / allDocs.length;
      }
    }, this);
  }
}
