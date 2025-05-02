import { errAsync, okAsync, ResultAsync } from 'neverthrow';
import { inject, singleton } from 'tsyringe';
import { AnyParams, generateId, Option } from '../common';
import { AfterInitAware, DI_TOKENS } from '../kernel';
import { ManagementLayer, PersistenceError, PersistenceLayer } from '../layers';
import {
  ContentType,
  Document,
  DocumentContent,
  DocumentContentInlined,
  DocumentInfo,
  DocumentReference,
  DocumentStatus,
  HydratedContentSchema,
  HydratedFieldSchema,
} from '../model';
import { CmsContext } from './cms-context';
import { DocumentValidationService } from './document-validation.service';
import { InvalidDocumentError, MissingDocIdError, UnknownContentTypeError } from './errors';
import { RenderService } from './render.service';

@singleton()
export class ContentService implements AfterInitAware {
  constructor(
    @inject(CmsContext) private readonly cmsContext: CmsContext,
    @inject(DocumentValidationService)
    private readonly documentValidationService: DocumentValidationService,
    @inject(RenderService) private readonly renderService: RenderService,
    @inject(DI_TOKENS.PersistenceLayer)
    private readonly persistenceLayer: PersistenceLayer<AnyParams>,
    @inject(DI_TOKENS.ManagementLayer) private readonly managementLayer: ManagementLayer<AnyParams>,
  ) {
    this.managementLayer.getContentSchemaPort.accept(async (store) => {
      const contentSchema = this.cmsContext.allContentSchemas.get(store);
      if (!contentSchema) {
        throw new Error(`Unknown content store: "${store}"`);
      }

      return contentSchema;
    });

    this.managementLayer.listDocumentsPort.accept((store) => {
      return this.listDocuments(store).match(
        (value) => value,
        (err) => {
          throw err;
        },
      );
    });

    this.managementLayer.getDocumentPort.accept((store, path, docId, variant) => {
      return this.getDocument(store, path, docId, variant)
        .map((docOption) => Option.getOrElse(docOption, undefined))
        .match(
          (value) => value,
          (err) => {
            throw err;
          },
        );
    });

    this.managementLayer.putDocumentPort.accept((store, path, content, docId, variant) => {
      return this.saveDocument(store, path, content, docId, variant).match(
        (value) => value,
        (err) => {
          throw err;
        },
      );
    });

    this.managementLayer.deleteDocumentPort.accept((store, path, docId, variant) => {
      return this.deleteDocument(store, path, docId, variant)
        .map((docOption) => Option.getOrElse(docOption, undefined))
        .match(
          (value) => value,
          (err) => {
            throw err;
          },
        );
    });

    this.managementLayer.renderDocumentPort.accept((store, path, docId, variant) => {
      return this.renderDocument(store, path, docId, variant);
    });
  }

  public async afterInit(): Promise<void> {
    return (
      await Promise.all(
        this.cmsContext.allContentSchemas
          .values()
          .map((contentSchema) => this.prepareRepo(contentSchema)),
      )
    ).forEach(() => {});
  }

  public listDocuments(
    store: string,
  ): ResultAsync<DocumentInfo[], UnknownContentTypeError | PersistenceError> {
    const contentSchema = this.cmsContext.publicContentSchemas.get(store);
    if (!contentSchema) {
      return errAsync(new UnknownContentTypeError(store));
    }

    switch (contentSchema.type) {
      case 'singleton':
        return this.persistenceLayer.listSingleton(store);
      case 'collection':
        return this.persistenceLayer.listAllFromCollection(store);
      case 'tree':
        return this.persistenceLayer.listAllFromTree(store);
    }

    return okAsync([]);
  }

  public getDocument(
    store: string,
    path: string[],
    docId?: string,
    variant?: string,
  ): ResultAsync<Option<Document>, UnknownContentTypeError | MissingDocIdError | PersistenceError> {
    const contentSchema = this.cmsContext.allContentSchemas.get(store);
    if (!contentSchema) {
      return errAsync(new UnknownContentTypeError(store));
    }

    variant = ContentService.resolveVariant(contentSchema, variant);

    switch (contentSchema.type) {
      case 'singleton':
        return this.persistenceLayer.getSingleton(store, variant);
      case 'collection':
        return docId
          ? this.persistenceLayer.getFromCollection(store, docId, variant)
          : errAsync(new MissingDocIdError('collection'));
      case 'tree':
        return docId
          ? this.persistenceLayer.getFromTree(store, path, docId, variant)
          : errAsync(new MissingDocIdError('tree'));
    }

    return okAsync(Option.none());
  }

  // TODO: if document is not draft republish it
  public saveDocument(
    store: string,
    path: string[],
    content: DocumentContent,
    docId?: string,
    variant?: string,
  ): ResultAsync<Document, UnknownContentTypeError | InvalidDocumentError | PersistenceError> {
    const contentSchema = this.cmsContext.allContentSchemas.get(store);
    if (!contentSchema) {
      return errAsync(new UnknownContentTypeError(store));
    }

    const validationResult = this.documentValidationService.validateDocumentContent(store, content);
    if (!validationResult.isValid) {
      return errAsync(new InvalidDocumentError(store, content, validationResult));
    }

    const now = new Date().toISOString();

    const document: Document = {
      id: ContentService.createDocumentId(contentSchema, docId),
      store,
      path,
      type: contentSchema.type,
      variant: ContentService.resolveVariant(contentSchema, variant),
      status: DocumentStatus.DRAFT,
      createdAt: now,
      lastModifiedAt: now,
      createdBy: '', // to be redefined in persistence layer
      content,
    };

    switch (contentSchema?.type) {
      case ContentType.SINGLETON:
        return this.persistenceLayer.putSingleton(store, document.variant, document);
      case ContentType.COLLECTION:
        return this.persistenceLayer.putToCollection(
          store,
          document.id,
          document.variant,
          document,
        );
      case ContentType.TREE:
        return this.persistenceLayer.putToTree(
          store,
          path,
          document.id,
          document.variant,
          document,
        );
    }

    return okAsync(document);
  }

  // TODO: cleanup hidden collections
  public deleteDocument(
    store: string,
    path: string[],
    docId?: string,
    variant?: string,
  ): ResultAsync<Option<Document>, UnknownContentTypeError | MissingDocIdError | PersistenceError> {
    const contentSchema = this.cmsContext.allContentSchemas.get(store);
    if (!contentSchema) {
      return errAsync(new UnknownContentTypeError(store));
    }

    variant = ContentService.resolveVariant(contentSchema, variant);

    switch (contentSchema.type) {
      case 'singleton':
        return this.persistenceLayer.deleteSingleton(store, variant);
      case 'collection':
        return docId
          ? this.persistenceLayer.deleteFromCollection(store, docId, variant)
          : errAsync(new MissingDocIdError('collection'));
      case 'tree':
        return docId
          ? this.persistenceLayer.deleteFromTree(store, path, docId, variant)
          : errAsync(new MissingDocIdError('tree'));
    }

    return okAsync(Option.none());
  }

  public async renderDocument(
    store: string,
    path: string[],
    docId?: string,
    variant?: string,
  ): Promise<void> {
    const contentSchema = this.cmsContext.publicContentSchemas.get(store);
    if (!contentSchema) {
      throw new Error(`Unknown content type: "${store}"`);
    }

    variant = ContentService.resolveVariant(contentSchema, variant);

    let doc: Document | undefined;

    switch (contentSchema.type) {
      case 'singleton':
        doc = await this.persistenceLayer
          .getSingleton(store, variant)
          .map((docOption) => Option.getOrElse(docOption, undefined))
          .match(
            (value) => value,
            (err) => {
              throw err;
            },
          );
        break;
      case 'collection':
        if (!docId) {
          throw new Error('Providing docId is mandatory when fetching document from a collection.');
        }
        doc = await this.persistenceLayer
          .getFromCollection(store, docId, variant)
          .map((docOption) => Option.getOrElse(docOption, undefined))
          .match(
            (value) => value,
            (err) => {
              throw err;
            },
          );
        break;
      case 'tree':
        if (!docId) {
          throw new Error('Providing docId is mandatory when fetching document from a tree.');
        }
        doc = await this.persistenceLayer
          .getFromTree(store, path, docId, variant)
          .map((docOption) => Option.getOrElse(docOption, undefined))
          .match(
            (value) => value,
            (err) => {
              throw err;
            },
          );
        break;
      default:
        return undefined;
    }

    if (doc) {
      const inlinedDoc = await this.inlineFieldGroups(doc, contentSchema);

      return this.renderService.renderDocument(
        inlinedDoc,
        contentSchema,
        variant === contentSchema.variants.default,
      );
    }
  }

  private async inlineFieldGroups(
    doc: Document,
    schema: HydratedContentSchema | HydratedFieldSchema,
  ): Promise<Document<DocumentContentInlined>> {
    const inlinedDoc: Document<DocumentContentInlined> = Object.assign({}, doc);

    for (const fieldSchema of schema.fields as HydratedFieldSchema[]) {
      if (fieldSchema.type.name === 'group' && doc.content[fieldSchema.name]) {
        const groupDocRefs = fieldSchema.isList
          ? (doc.content[fieldSchema.name] as string[])
          : [doc.content[fieldSchema.name] as string];

        const groupDocsContent: DocumentContentInlined[] = [];

        for (const groupDocRef of groupDocRefs) {
          const ref = DocumentReference.parse(groupDocRef);
          const groupFieldDoc = await this.persistenceLayer
            .getFromCollection(ref.store, ref.docId!, ref.variant!)
            .map((docOption) => Option.getOrElse(docOption, undefined))
            .unwrapOr(undefined);

          if (!groupFieldDoc) {
            throw new Error(`Cannot find group field document: "${groupDocRef}"`);
          }

          const inlinedFieldGroupDoc = await this.inlineFieldGroups(groupFieldDoc, fieldSchema);
          groupDocsContent.push(inlinedFieldGroupDoc.content);
        }

        if (fieldSchema.isList) {
          inlinedDoc.content[fieldSchema.name] = groupDocsContent;
        } else {
          inlinedDoc.content[fieldSchema.name] = groupDocsContent[0];
        }
      }
    }

    return inlinedDoc;
  }

  private prepareRepo(contentSchema: HydratedContentSchema): ResultAsync<void, PersistenceError> {
    switch (contentSchema.type) {
      case 'singleton':
        return this.persistenceLayer.prepareSingletonRepo(contentSchema);
      case 'collection':
        return this.persistenceLayer.prepareCollectionRepo(contentSchema);
      case 'tree':
        return this.persistenceLayer.prepareTreeRepo(contentSchema);
    }

    return okAsync(undefined);
  }

  // TODO: write test
  static createDocumentId(schema: HydratedContentSchema, providedDocId?: string): string {
    return schema.type === 'singleton'
      ? schema.name
      : providedDocId || generateId(schema.name + '-');
  }

  static resolveVariant(contentSchema: HydratedContentSchema, variant?: string): string {
    variant ||= contentSchema.variants.default;
    if (contentSchema.variants.values.includes(variant)) {
      return variant;
    } else {
      throw new Error(`Unsupported content variant: "${variant}"`);
    }
  }
}
