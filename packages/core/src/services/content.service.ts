import { failure, Outcome, Program, program, success } from 'defectless';
import { inject, singleton } from 'tsyringe';
import { AnyParams, generateId, Option } from '../common';
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
    @inject(DI_TOKENS.ManagementLayer) private readonly managementLayer: ManagementLayer<AnyParams>,
  ) {
    this.managementLayer.getContentSchemaPort.accept((store) => {
      return success(Option.fromNullable(this.cmsContext.allContentSchemas.get(store)));
    });

    this.managementLayer.listDocumentsPort.accept((store) => {
      return this.listDocuments(store);
    });

    this.managementLayer.getDocumentPort.accept((store, path, docId, variant) => {
      return this.getDocument(store, path, docId, variant);
    });

    this.managementLayer.putDocumentPort.accept((store, path, content, docId, variant) => {
      return this.saveDocument(store, path, content, docId, variant);
    });

    this.managementLayer.deleteDocumentPort.accept((store, path, docId, variant) => {
      return this.deleteDocument(store, path, docId, variant);
    });

    this.managementLayer.publishDocumentPort.accept((store, path, docId, variant) => {
      return this.publishDocument(store, path, docId, variant);
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
    const contentSchema = this.cmsContext.publicContentSchemas.get(store);
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
    store: string,
    path: string[],
    docId?: string,
    variant?: string,
  ): Outcome<
    Option<Document>,
    UnknownContentTypeError | UnsupportedContentVariant | MissingDocIdError | PersistenceError
  > {
    const contentSchema = this.cmsContext.allContentSchemas.get(store);
    if (!contentSchema) {
      return failure(new UnknownContentTypeError(store));
    }

    return ContentService.resolveVariant(contentSchema, variant).flatMap((variant) => {
      switch (contentSchema.type) {
        case 'singleton':
          return this.persistenceLayer.getSingleton(store, variant);
        case 'collection':
          return docId
            ? this.persistenceLayer.getFromCollection(store, docId, variant)
            : failure(new MissingDocIdError(ContentType.COLLECTION, store));
        case 'tree':
          return docId
            ? this.persistenceLayer.getFromTree(store, path, docId, variant)
            : failure(new MissingDocIdError(ContentType.TREE, store));
      }

      return success(Option.none());
    });
  }

  // TODO: if document is not draft republish it
  public saveDocument(
    store: string,
    path: string[],
    content: DocumentContent,
    docId?: string,
    variant?: string,
  ): Outcome<
    Document,
    UnknownContentTypeError | UnsupportedContentVariant | InvalidDocumentError | PersistenceError
  > {
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

      const document: Document = {
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

      return success(document);
    }, this);
  }

  // TODO: cleanup hidden collections
  public deleteDocument(
    store: string,
    path: string[],
    docId?: string,
    variant?: string,
  ): Outcome<
    Option<Document>,
    UnknownContentTypeError | MissingDocIdError | UnsupportedContentVariant | PersistenceError
  > {
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
    store: string,
    path: string[],
    docId?: string,
    variant?: string,
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
    const contentSchema = this.cmsContext.publicContentSchemas.get(store);
    if (!contentSchema) {
      return failure(new UnknownContentTypeError(store));
    }

    const fetchDoc: Outcome<
      Option<Document>,
      UnsupportedContentVariant | MissingDocIdError | PersistenceError
    > = ContentService.resolveVariant(contentSchema, variant).flatMap((resolvedVariant) => {
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

    return fetchDoc.flatMap((optionalDoc) => {
      if (Option.isNone(optionalDoc)) {
        return success();
      }

      return this.inlineFieldGroups(optionalDoc.value, contentSchema).flatMap((inlinedDoc) =>
        this.renderService.renderDocument(
          inlinedDoc,
          contentSchema,
          variant === contentSchema.variants.default,
        ),
      );
    });
  }

  private inlineFieldGroups(
    doc: Document,
    schema: HydratedContentSchema | HydratedFieldSchema,
  ): Outcome<Document<DocumentContentInlined>, MissingDocumentError | PersistenceError> {
    const inlinedDoc: Document<DocumentContentInlined> = Object.assign({}, doc);

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
              return failure(new MissingDocumentError(ref.store, ref.path, ref.docId, ref.variant));
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
