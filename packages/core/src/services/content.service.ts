import {
  ContentSchema,
  ContentType, ContentVariantsSchema,
  Document,
  DocumentContent,
  DocumentContentInlined,
  DocumentReference,
  DocumentStatus, FieldSchema,
  generateId
} from '../common';
import {DocumentInfo, ManagementLayer, PersistenceLayer} from '../layers';
import {inject, singleton} from 'tsyringe';
import {AfterInitAware, DI_TOKENS} from '../kernel';
import {DocumentValidationService} from './document-validation.service';
import {ContentSchemasLoaderService} from './content-schemas-loader.service';
import {RenderService} from './render.service';

@singleton()
export class ContentService implements AfterInitAware {
  private readonly contentSchemas = new Map<string, ContentSchema>();

  constructor(@inject(ContentSchemasLoaderService) private readonly schemasLoader: ContentSchemasLoaderService,
              @inject(DocumentValidationService) private readonly documentValidationService: DocumentValidationService,
              @inject(RenderService) private readonly renderService: RenderService,
              @inject(DI_TOKENS.PersistenceLayer) private readonly persistenceLayer: PersistenceLayer<any>,
              @inject(DI_TOKENS.ManagementLayer) private readonly managementLayer: ManagementLayer<any>) {
    this.managementLayer.getContentSchemaPort.accept(async store => {
      if (!this.contentSchemas.has(store)) {
        throw new Error(`Unknown content store: "${store}"`);
      }

      return this.contentSchemas.get(store)!;
    });

    this.managementLayer.listDocumentsPort.accept(store => {
      return this.listDocuments(store);
    });

    this.managementLayer.getDocumentPort.accept((store, path, docId, variant) => {
      return this.getDocument(store, path, docId, variant);
    });

    this.managementLayer.putDocumentPort.accept((store, path,  content, docId, variant) => {
      return this.saveDocument(store, path,  content, docId, variant);
    });

    this.managementLayer.deleteDocumentPort.accept((store, path, docId, variant) => {
      return this.deleteDocument(store, path, docId, variant);
    });

    this.managementLayer.renderDocumentPort.accept((store, path, docId, variant) => {
      return this.renderDocument(store, path, docId, variant);
    });
  }

  public async afterInit(): Promise<void> {
    (await this.schemasLoader.getAllContentSchemas())
        .forEach(contentSchema => this.contentSchemas.set(contentSchema.name, contentSchema));
  }

  public async listDocuments(store: string): Promise<DocumentInfo[]> {
    const contentSchema = this.contentSchemas.get(store);
    if (!contentSchema) {
      throw new Error(`Unknown content type: "${store}"`);
    }

    switch (contentSchema.type) {
      case 'singleton':
        return this.persistenceLayer.listSingleton(store);
      case 'collection':
        return this.persistenceLayer.listAllFromCollection(store);
      case 'tree':
        return this.persistenceLayer.listAllFromTree(store);
      default:
        return [];
    }
  }

  public async getDocument(store: string, path: string[], docId?: string, variant?: string): Promise<Document | undefined> {
    const contentSchema = this.contentSchemas.get(store);
    if (!contentSchema) {
      throw new Error(`Unknown content type: "${store}"`);
    }

    variant = ContentService.resolveVariant(contentSchema, variant);

    switch (contentSchema.type) {
      case 'singleton':
        return this.persistenceLayer.getSingleton(store, variant);
      case 'collection':
        if (!docId) {
          throw new Error('Providing docId is mandatory when fetching document from a collection.');
        }
        return this.persistenceLayer.getFromCollection(store, docId, variant);
      case 'tree':
        if (!docId) {
          throw new Error('Providing docId is mandatory when fetching document from a tree.');
        }
        return this.persistenceLayer.getFromTree(store, path, docId, variant)
      default:
        return undefined;
    }
  }

  public async saveDocument(store: string, path: string[], content: DocumentContent, docId?: string, variant?: string): Promise<Document> {
    const contentSchema = this.contentSchemas.get(store);
    if (!contentSchema) {
      throw new Error(`Unknown content type: "${store}"`);
    }

    const validationResult = this.documentValidationService.validateDocumentContent(store, content);

    if (!validationResult.isValid) {
      throw new Error(
          `Document content doesn't match the structure of schema "${store}":
          ${JSON.stringify(validationResult, null, 2)}`);
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
      createdBy: '',  // to be redefined in persistence layer
      content,
    };

    switch (contentSchema?.type) {
      case ContentType.SINGLETON:
        return this.persistenceLayer.putSingleton(store, document.variant, document);
      case ContentType.COLLECTION:
        return this.persistenceLayer.putToCollection(store, document.id, document.variant, document);
      case ContentType.TREE:
        return this.persistenceLayer.putToTree(store, path, document.id, document.variant, document);
    }
  }

  // TODO: cleanup hidden collections
  public async deleteDocument(store: string, path: string[], docId?: string, variant?: string): Promise<Document | undefined> {
    const contentSchema = this.contentSchemas.get(store);
    if (!contentSchema) {
      throw new Error(`Unknown content type: "${store}"`);
    }

    variant = ContentService.resolveVariant(contentSchema, variant);

    switch (contentSchema.type) {
      case 'singleton':
        return this.persistenceLayer.deleteSingleton(store, variant);
      case 'collection':
        if (!docId) {
          throw new Error('Providing docId is mandatory when removing document from a collection.');
        }
        return this.persistenceLayer.deleteFromCollection(store, docId, variant);
      case 'tree':
        if (!docId) {
          throw new Error('Providing docId is mandatory when removing document from a tree.');
        }
        return this.persistenceLayer.deleteFromTree(store, path, docId, variant)
      default:
        return undefined;
    }
  }

  public async renderDocument(store: string, path: string[], docId?: string, variant?: string): Promise<void> {
    const contentSchema = this.contentSchemas.get(store);
    if (!contentSchema) {
      throw new Error(`Unknown content type: "${store}"`);
    }

    variant = ContentService.resolveVariant(contentSchema, variant);

    let doc: Document | undefined;

    switch (contentSchema.type) {
      case 'singleton':
        doc = await this.persistenceLayer.getSingleton(store, variant);
        break;
      case 'collection':
        if (!docId) {
          throw new Error('Providing docId is mandatory when fetching document from a collection.');
        }
        doc = await this.persistenceLayer.getFromCollection(store, docId, variant);
        break;
      case 'tree':
        if (!docId) {
          throw new Error('Providing docId is mandatory when fetching document from a tree.');
        }
        doc = await this.persistenceLayer.getFromTree(store, path, docId, variant);
        break;
      default:
        return undefined;
    }

    if (doc) {
      const inlinedDoc = await this.inlineFieldGroups(doc, contentSchema);

      const defaultVariant = ContentService.defaultVariant(contentSchema);
      return this.renderService.renderDocument(
          inlinedDoc,
          contentSchema,
          variant === defaultVariant,
          this.schemasLoader.publicContentSchemas);
    }
  }

  private async inlineFieldGroups(doc: Document, schema: ContentSchema | FieldSchema): Promise<Document<DocumentContentInlined>> {
    const inlinedDoc: Document<DocumentContentInlined> = Object.assign({}, doc);

    for (const fieldSchema of schema.fields as FieldSchema[]) {
      if (fieldSchema.type.name === 'group' && doc.content[fieldSchema.name]) {
        const groupDocRefs = fieldSchema.isList
            ? doc.content[fieldSchema.name] as string[]
            : [ doc.content[fieldSchema.name] as string ];

        const groupDocsContent: DocumentContentInlined[] = [];

        for (const groupDocRef of groupDocRefs) {
          const ref = DocumentReference.parse(groupDocRef);
          let groupFieldDoc = await this.persistenceLayer.getFromCollection(
              ref.store, ref.docId!, ref.variant!);

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

  // TODO: write test
  static createDocumentId(schema: ContentSchema, providedDocId?: string): string {
    return schema.type === 'singleton'
        ? schema.name
        : providedDocId || generateId(schema.name + '-');
  }

  // TODO: use defaultVariant
  static resolveVariant(schema: ContentSchema, variant?: string): string {
    let defaultVariant: string = 'default';
    let allVariants: string[] = [ defaultVariant ];

    if (Array.isArray(schema.variants)) {
      allVariants = schema.variants;
      defaultVariant = allVariants.length ? allVariants[0] : defaultVariant;
    } else if (schema.variants) {
      const variants = schema.variants as ContentVariantsSchema
      allVariants = variants.values;

      if (variants.default) {
        defaultVariant = variants.default;
      } else if (allVariants.length) {
        defaultVariant = allVariants.length ? allVariants[0] : defaultVariant;
      }
    }

    if (variant) {
      if (allVariants.includes(variant)) {
        return variant;
      } else {
        throw new Error(`Unsupported content variant: "${variant}"`);
      }
    } else {
      return defaultVariant;
    }
  }

  static defaultVariant(schema: ContentSchema): string {
    if (Array.isArray(schema.variants)) {
      return schema.variants.length ? schema.variants[0] : 'default';
    } else if (schema.variants) {
      const variants = schema.variants as ContentVariantsSchema;
      return variants.default
          ? variants.default
          : variants.values[0];
    }

    return 'default';
  }
}
