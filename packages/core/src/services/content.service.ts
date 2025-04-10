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

    this.managementLayer.putDocumentPort.accept((store, path,  content, id, variant) => {
      return this.saveDocument(store, path,  content, id, variant);
    });
  }

  public async afterInit(): Promise<void> {
    (await this.schemasLoader.getAllContentSchemas())
        .forEach(contentSchema => this.contentSchemas.set(contentSchema.name, contentSchema));
  }

  public async saveDocument(store: string, path: string[], content: any, id?: string, variant?: string): Promise<Document<any>> {
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
      id: id || this.createDocumentId(content, contentSchema),
      store,
      path,
      type: contentSchema.type,
      variant: this.resolveVariant(contentSchema, variant),
      status: DocumentStatus.DRAFT,
      createdAt: 'now', // TODO: put the right date
      lastModifiedAt: 'now', // TODO: put the right date
      createdBy: 'sapphire@0.0.0',  // TODO: put the presistence layer version
      content,
    };

    switch (contentSchema?.type) {
      case ContentType.SINGLETON:
        return this.persistence.putSingleton(store, document, document.variant);
      case ContentType.COLLECTION:
        return this.persistence.putToCollection(store, document.id, document, document.variant);
      case ContentType.TREE:
        return this.persistence.putToTree(store, path, document.id, document, document.variant);
    }
  }

  private createDocumentId(content: any, schema: ContentSchema): string {
    if (schema.type === 'singleton') {
      return schema.name;
    }

    const idField = schema.fields.filter(field => field.type === 'id');

    let documentId: string | undefined = idField.length ? content[idField[0].name] : '';
    if (!documentId || !documentId.length) {
      documentId = generateId(schema.name + '-');
    }

    return documentId;
  }

  private resolveVariant(schema: ContentSchema, variant?: string): string {
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
