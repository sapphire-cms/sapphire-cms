import {ContentType, Document, DocumentStatus, generateId} from '../common';
import {ManagementLayer, PersistenceLayer} from '../layers';
import {ContentSchema, ContentVariantsSchema} from '../loadables';
import {inject, singleton} from 'tsyringe';
import {AfterInitAware, DI_TOKENS} from '../kernel';
import {DocumentValidationService} from './document-validation.service';
import {ContentSchemasLoaderService} from './content-schemas-loader.service';

@singleton()
export class ContentService implements AfterInitAware {
  private readonly contentSchemas = new Map<string, ContentSchema>();

  constructor(@inject(ContentSchemasLoaderService) private readonly schemasLoader: ContentSchemasLoaderService,
              @inject(DocumentValidationService) private readonly documentValidationService: DocumentValidationService,
              @inject(DI_TOKENS.PersistenceLayer) private readonly persistence: PersistenceLayer<any>,
              @inject(DI_TOKENS.ManagementLayer) private readonly managementLayer: ManagementLayer<any>) {
    this.managementLayer.getContentSchemaPort.accept(async store => {
      if (!this.contentSchemas.has(store)) {
        throw new Error(`Unknown content store: "${store}"`);
      }

      return this.contentSchemas.get(store)!;
    });

    // TODO: remove this port
    this.managementLayer.getDocumentIdsPort.accept(async (store) => {
      return this.listDocumentIds(store);
    });

    this.managementLayer.listDocumentsPort.accept(async store => {
      const contentSchema = this.contentSchemas.get(store);
      if (!contentSchema) {
        throw new Error(`Unknown content type: "${store}"`);
      }

      switch (contentSchema.type) {
        case 'singleton':
          // TODO: think how to handle that
          return this.persistence.listSingleton(store);
        case 'collection':
          return this.persistence.listAllFromCollection(store);
        case 'tree':
          return this.persistence.listAllFromTree(store);
        default:
          return [];
      }
    });

    this.managementLayer.getDocumentPort.accept(async (store, path, docId, variant) => {
      const contentSchema = this.contentSchemas.get(store);
      if (!contentSchema) {
        throw new Error(`Unknown content type: "${store}"`);
      }

      variant = ContentService.resolveVariant(contentSchema, variant);

      switch (contentSchema.type) {
        case 'singleton':
          return this.persistence.getSingleton(store, variant);
        case 'collection':
          if (!docId) {
            throw new Error('Providing docId is mandatory when fetching document from a collection.');
          }
          return this.persistence.getFromCollection(store, docId, variant);
        case 'tree':
          if (!docId) {
            throw new Error('Providing docId is mandatory when fetching document from a tree.');
          }
          return this.persistence.getFromTree(store, path, docId, variant)
        default:
          return undefined;
      }
    });

    this.managementLayer.putDocumentPort.accept((store, path,  content, docId, variant) => {
      return this.saveDocument(store, path,  content, docId, variant);
    });
  }

  public async afterInit(): Promise<void> {
    (await this.schemasLoader.getAllContentSchemas())
        .forEach(contentSchema => this.contentSchemas.set(contentSchema.name, contentSchema));
  }

  public async listDocumentIds(store: string): Promise<string[]> {
    const contentSchema = this.contentSchemas.get(store);
    if (!contentSchema) {
      throw new Error(`Unknown content type: "${store}"`);
    }

    switch (contentSchema.type) {
      case 'singleton':
        const singletonIds = await this.persistence.listIdsSingletons();
        return singletonIds.includes(store)
            ? [ store ]
            : [];
      case 'collection':
        return this.persistence.listIdsCollection(store);
      case 'tree':
        return this.persistence.listIdsTree(store);
      default:
        return [];
    }
  }

  public async saveDocument(store: string, path: string[], content: any, docId?: string, variant?: string): Promise<Document<any>> {
    const contentSchema = this.contentSchemas.get(store);
    if (!contentSchema) {
      throw new Error(`Unknown content type: "${store}"`);
    }

    const validationResult = this.documentValidationService.validateDocument(store, content);

    if (!validationResult.success) {
      throw new Error(
          `Document content doesn't match the structure of schema "${store}":
          ${JSON.stringify(validationResult.error.format(), null, 2)}`);
    }

    const document: Document<any> = {
      id: this.createDocumentId(contentSchema, docId),
      store,
      path,
      type: contentSchema.type,
      variant: ContentService.resolveVariant(contentSchema, variant),
      status: DocumentStatus.DRAFT,
      createdAt: 'now', // TODO: put the right date
      lastModifiedAt: 'now', // TODO: put the right date
      createdBy: 'sapphire@0.0.0',  // TODO: put the presistence layer version
      content,
    };

    switch (contentSchema?.type) {
      case ContentType.SINGLETON:
        return this.persistence.putSingleton(store, document.variant, document);
      case ContentType.COLLECTION:
        return this.persistence.putToCollection(store, document.id, document.variant, document);
      case ContentType.TREE:
        return this.persistence.putToTree(store, path, document.id, document.variant, document);
    }
  }

  private createDocumentId(schema: ContentSchema, providedDocId?: string): string {
    return schema.type === 'singleton'
        ? schema.name
        : providedDocId || generateId(schema.name + '-');
  }

  static resolveVariant(schema: ContentSchema, variant?: string): string {
    let allVariants: string[] = [];
    let defaultVariant: string = 'default';

    if (Array.isArray(schema.variants)) {
      allVariants = schema.variants;
      defaultVariant = allVariants.length ? allVariants[0] : defaultVariant;
    } else if (schema.variants) {
      const variants = schema.variants as ContentVariantsSchema
      allVariants = variants.values;

      if (variants.default) {
        defaultVariant = variants.default
      } else if (allVariants.length) {
        defaultVariant = allVariants[0];
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
}
