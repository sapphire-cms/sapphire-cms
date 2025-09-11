import { failure, Outcome, Program, program, success } from 'defectless';
import { inject, singleton } from 'tsyringe';
import { AnyParams, deepClone, generateId, matchError, Option } from '../common';
import { AfterInitAware, DeliveryError, DI_TOKENS, PersistenceError, RenderError } from '../kernel';
import { ManagementLayer, PersistenceLayer } from '../layers';
import {
  ContentType,
  ContentValidationResult,
  Document,
  DocumentContent,
  DocumentContentInlined,
  DocumentInfo,
  DocumentReference,
  DocumentStatus,
  HydratedContentSchema,
  HydratedFieldSchema,
  InvalidDocumentError,
  MissingDocIdError,
  MissingDocumentError,
  UnknownContentTypeError,
  UnsupportedContentVariant,
} from '../model';
import { CmsContext } from './cms-context';
import { DocumentValidationService } from './document-validation.service';
import { RenderService } from './render.service';
import { SecureManagementLayer } from './secure-management.layer';

@singleton()
export class ContentService implements AfterInitAware {
  // TODO: write test
  // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
  static createDocumentId(schema: HydratedContentSchema, providedDocId?: string): string {
    return schema.type === 'singleton'
      ? schema.name
      : providedDocId || generateId(schema.name + '-');
  }

  // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
  static resolveVariant(
    contentSchema: HydratedContentSchema,
    variant?: string,
  ): Outcome<string, UnsupportedContentVariant> {
    variant ||= contentSchema.variants.default;

    return contentSchema.variants.values.includes(variant)
      ? success(variant)
      : failure(new UnsupportedContentVariant(variant));
  }

  constructor(
    @inject(CmsContext) private readonly cmsContext: CmsContext,
    @inject(DocumentValidationService)
    private readonly documentValidationService: DocumentValidationService,
    @inject(RenderService) private readonly renderService: RenderService,
    @inject(DI_TOKENS.PersistenceLayer)
    private readonly persistenceLayer: PersistenceLayer<AnyParams>,
    @inject(SecureManagementLayer) private readonly managementLayer: ManagementLayer,
  ) {
    this.managementLayer.getHydratedContentSchemasPort.accept(() => {
      return success([...cmsContext.publicHydratedContentSchemas.values()]);
    });

    this.managementLayer.getContentSchemasPort.accept(() => {
      return success([...cmsContext.publicContentSchemas.values()]);
    });

    this.managementLayer.getHydratedContentSchemaPort.accept((store) => {
      return success(Option.fromNullable(this.cmsContext.allContentSchemas.get(store)));
    });

    this.managementLayer.getContentSchemaPort.accept((store) => {
      return success(Option.fromNullable(this.cmsContext.publicContentSchemas.get(store)));
    });

    this.managementLayer.listDocumentsPort.accept((store) => {
      return this.listDocuments(store);
    });

    this.managementLayer.getDocumentPort.accept((docRef) => {
      return this.getDocument(docRef);
    });

    this.managementLayer.putDocumentPort.accept((docRef, content) => {
      return this.saveDocument(docRef, content);
    });

    this.managementLayer.deleteDocumentPort.accept((docRef) => {
      return this.deleteDocument(docRef);
    });

    this.managementLayer.publishDocumentPort.accept((docRef) => {
      return this.publishDocument(docRef);
    });
  }

  public afterInit(): Outcome<void, PersistenceError> {
    const tasks = Array.from(this.cmsContext.allContentSchemas.values()).map((contentSchema) =>
      this.prepareRepo(contentSchema),
    );

    return Outcome.all(tasks)
      .map(() => {})
      .mapFailure((errors: (PersistenceError | undefined)[]) => {
        const message = errors
          .filter((error) => !!error)
          .map((error) => error!.message)
          .join('\n');
        return new PersistenceError(message);
      });
  }

  public listDocuments(
    store: string,
  ): Outcome<DocumentInfo[], UnknownContentTypeError | PersistenceError> {
    const contentSchema = this.cmsContext.publicHydratedContentSchemas.get(store);
    if (!contentSchema) {
      return failure(new UnknownContentTypeError(store));
    }

    switch (contentSchema.type) {
      case 'singleton':
        return this.persistenceLayer.listSingleton(store);
      case 'collection':
        return this.persistenceLayer.listAllFromCollection(store);
      case 'tree':
        return this.persistenceLayer.listAllFromTree(store);
    }

    return success([]);
  }

  public getDocument(
    docRef: DocumentReference,
  ): Outcome<
    Option<Document>,
    UnknownContentTypeError | UnsupportedContentVariant | MissingDocIdError | PersistenceError
  > {
    const contentSchema = this.cmsContext.allContentSchemas.get(docRef.store);
    if (!contentSchema) {
      return failure(new UnknownContentTypeError(docRef.store));
    }

    return this.fetchDocument(contentSchema, docRef);
  }

  public saveDocument(
    docRef: DocumentReference,
    content: DocumentContent,
  ): Outcome<
    Document,
    UnknownContentTypeError | UnsupportedContentVariant | InvalidDocumentError | PersistenceError
  > {
    const { store, path, docId, variant } = docRef;
    const contentSchema = this.cmsContext.allContentSchemas.get(store);
    if (!contentSchema) {
      return failure(new UnknownContentTypeError(store));
    }

    const now = new Date().toISOString();

    return program(function* (): Program<
      Document,
      UnknownContentTypeError | UnsupportedContentVariant | InvalidDocumentError | PersistenceError
    > {
      const validationResult: ContentValidationResult = yield this.documentValidationService
        .validateDocumentContent(store, content)
        .flatMap((validationResult) => success(validationResult));

      if (!validationResult.isValid) {
        return failure(new InvalidDocumentError(store, content, validationResult));
      }

      const resolvedVariant: string = yield ContentService.resolveVariant(
        contentSchema,
        variant,
      ).flatMap((val) => success(val));

      // TODO: fix signature of recover method
      const docOption: Option<Document> = yield this.fetchDocument(contentSchema, docRef).recover(
        (error) => {
          return matchError(error, {
            MissingDocIdError: (_) =>
              success(Option.none() as Option<Document>) as Outcome<
                Option<Document>,
                UnsupportedContentVariant | PersistenceError
              >,
            _: (otherError) =>
              failure(otherError as UnsupportedContentVariant | PersistenceError) as Outcome<
                Option<Document>,
                UnsupportedContentVariant | PersistenceError
              >,
          });
        },
      );
      let document: Document;

      if (Option.isSome(docOption)) {
        document = docOption.value;
        document.content = content;
        document.lastModifiedAt = now;
      } else {
        document = {
          id: ContentService.createDocumentId(contentSchema, docId),
          store,
          path,
          type: contentSchema.type,
          variant: resolvedVariant,
          status: DocumentStatus.DRAFT,
          createdAt: now,
          lastModifiedAt: now,
          createdBy: '', // to be redefined in persistence layer
          content,
        };
      }

      const persistedDocument = yield this.persistDocument(contentSchema, document);

      if (persistedDocument.status === DocumentStatus.PUBLISHED) {
        this.publishDocument(docRef);
      }

      return success(persistedDocument);
    }, this);
  }

  // TODO: cleanup hidden collections
  public deleteDocument(
    docRef: DocumentReference,
  ): Outcome<
    Option<Document>,
    UnknownContentTypeError | MissingDocIdError | UnsupportedContentVariant | PersistenceError
  > {
    const { store, path, docId, variant } = docRef;
    const contentSchema = this.cmsContext.allContentSchemas.get(store);
    if (!contentSchema) {
      return failure(new UnknownContentTypeError(store));
    }

    return ContentService.resolveVariant(contentSchema, variant).flatMap((variant) => {
      switch (contentSchema.type) {
        case 'singleton':
          return this.persistenceLayer.deleteSingleton(store, variant);
        case 'collection':
          return docId
            ? this.persistenceLayer.deleteFromCollection(store, docId, variant)
            : failure(new MissingDocIdError(ContentType.COLLECTION, store));
        case 'tree':
          return docId
            ? this.persistenceLayer.deleteFromTree(store, path, docId, variant)
            : failure(new MissingDocIdError(ContentType.TREE, store));
      }

      return success(Option.none());
    });
  }

  public publishDocument(
    docRef: DocumentReference,
  ): Outcome<
    void,
    | UnknownContentTypeError
    | UnsupportedContentVariant
    | MissingDocIdError
    | MissingDocumentError
    | PersistenceError
    | RenderError
    | DeliveryError
  > {
    const contentSchema = this.cmsContext.publicHydratedContentSchemas.get(docRef.store);
    if (!contentSchema) {
      return failure(new UnknownContentTypeError(docRef.store));
    }

    return program(function* (): Program<
      void,
      | UnknownContentTypeError
      | UnsupportedContentVariant
      | MissingDocIdError
      | MissingDocumentError
      | PersistenceError
      | RenderError
      | DeliveryError
    > {
      const optionalDoc: Option<Document> = yield this.fetchDocument(contentSchema, docRef);

      if (Option.isNone(optionalDoc)) {
        return success();
      }

      const document = optionalDoc.value;
      const inlinedDoc: Document<DocumentContentInlined> = yield this.inlineFieldGroups(
        document,
        contentSchema,
      );

      yield this.renderService.renderDocument(
        inlinedDoc,
        contentSchema,
        docRef.variant === contentSchema.variants.default,
      );

      if (document.status === DocumentStatus.DRAFT) {
        document.status = DocumentStatus.PUBLISHED;
        yield this.persistDocument(contentSchema, document);
      }
    }, this);
  }

  private fetchDocument(
    contentSchema: HydratedContentSchema,
    docRef: DocumentReference,
  ): Outcome<Option<Document>, UnsupportedContentVariant | MissingDocIdError | PersistenceError> {
    const { store, path, docId, variant } = docRef;

    return ContentService.resolveVariant(contentSchema, variant).flatMap((resolvedVariant) => {
      switch (contentSchema.type) {
        case 'singleton':
          return this.persistenceLayer.getSingleton(store, resolvedVariant);
        case 'collection':
          return docId
            ? this.persistenceLayer.getFromCollection(store, docId, resolvedVariant)
            : failure(new MissingDocIdError(ContentType.COLLECTION, store));
        case 'tree':
          return docId
            ? this.persistenceLayer.getFromTree(store, path, docId, resolvedVariant)
            : failure(new MissingDocIdError(ContentType.TREE, store));
        default:
          return success(Option.none());
      }
    });
  }

  private persistDocument(
    contentSchema: HydratedContentSchema,
    document: Document,
  ): Outcome<Document, PersistenceError> {
    switch (contentSchema?.type) {
      case ContentType.SINGLETON:
        return this.persistenceLayer.putSingleton(document.store, document.variant, document);
      case ContentType.COLLECTION:
        return this.persistenceLayer.putToCollection(
          document.store,
          document.id,
          document.variant,
          document,
        );
      case ContentType.TREE:
        return this.persistenceLayer.putToTree(
          document.store,
          document.path,
          document.id,
          document.variant,
          document,
        );
    }
  }

  private inlineFieldGroups(
    doc: Document,
    schema: HydratedContentSchema | HydratedFieldSchema,
  ): Outcome<Document<DocumentContentInlined>, MissingDocumentError | PersistenceError> {
    const inlinedDoc: Document<DocumentContentInlined> = deepClone(doc);

    return program(function* (): Program<
      Document<DocumentContentInlined>,
      MissingDocumentError | PersistenceError
    > {
      for (const fieldSchema of schema.fields as HydratedFieldSchema[]) {
        if (fieldSchema.type.name === 'group' && doc.content[fieldSchema.name]) {
          const groupDocRefs = fieldSchema.isList
            ? (doc.content[fieldSchema.name] as string[])
            : [doc.content[fieldSchema.name] as string];

          const groupDocsContent: DocumentContentInlined[] = [];

          for (const groupDocRef of groupDocRefs) {
            const ref = DocumentReference.parse(groupDocRef);
            const groupFieldDoc: Option<Document> = yield this.persistenceLayer.getFromCollection(
              ref.store,
              ref.docId!,
              ref.variant!,
            );

            if (Option.isNone(groupFieldDoc)) {
              return failure(new MissingDocumentError(ref));
            }

            const inlinedFieldGroupDoc: Document<DocumentContentInlined> =
              yield this.inlineFieldGroups(groupFieldDoc.value, fieldSchema);
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
    }, this);
  }

  private prepareRepo(contentSchema: HydratedContentSchema): Outcome<void, PersistenceError> {
    switch (contentSchema.type) {
      case 'singleton':
        return this.persistenceLayer.prepareSingletonRepo(contentSchema);
      case 'collection':
        return this.persistenceLayer.prepareCollectionRepo(contentSchema);
      case 'tree':
        return this.persistenceLayer.prepareTreeRepo(contentSchema);
    }

    return success();
  }
}
