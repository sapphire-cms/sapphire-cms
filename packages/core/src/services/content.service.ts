import {ContentType, generateId} from '../common';
import {BootstrapLayer, ManagementLayer, PersistenceLayer} from '../layers';
import {ContentSchema} from '../loadables';
import {inject, singleton} from 'tsyringe';
import {AfterInitAware, DI_TOKENS} from '../kernel';
import {DocumentValidationService} from './document-validation.service';

@singleton()
export class ContentService implements AfterInitAware {
  private readonly contentSchemas = new Map<string, ContentSchema>();

  constructor(@inject(DocumentValidationService) private readonly documentValidationService: DocumentValidationService,
              @inject(DI_TOKENS.BootstrapLayer) private readonly bootstrap: BootstrapLayer<any>,
              @inject(DI_TOKENS.PersistenceLayer) private readonly persistence: PersistenceLayer<any>,
              @inject(DI_TOKENS.ManagementLayer) private readonly managementLayer: ManagementLayer<any>) {
    this.managementLayer.getContentSchemaPort.accept(async storeName => {
      if (!this.contentSchemas.has(storeName)) {
        throw new Error(`Unknown content store: "${storeName}"`);
      }

      return this.contentSchemas.get(storeName)!;
    });

    this.managementLayer.putDocumentPort.accept(async (storeName, doc) => {
      await this.saveDocument(storeName, doc);
      return doc;
    });
  }

  public afterInit(): Promise<void> {
    return this.bootstrap.getAllContentSchemas().then(contentSchemas => {
      const prepareStoresPromises: Promise<void>[] = [];

      // Load content schemas
      for (const contentSchema of contentSchemas) {
        this.contentSchemas.set(contentSchema.name, contentSchema);

        prepareStoresPromises.push(this.persistence.prepareStore(contentSchema));
      }

      return Promise.all(prepareStoresPromises);
    }).then(() => {});
  }

  public async saveDocument(store: string, document: any): Promise<void> {
    const contentSchema = this.contentSchemas.get(store);
    if (!contentSchema) {
      throw new Error(`Unknown content type: "${store}"`);
    }

    const validationResult = this.documentValidationService.validateDocument(store, document);

    if (!validationResult.success) {
      throw new Error(
          `Document doesn't match the structure of schema "${store}":
          ${JSON.stringify(validationResult.error.format(), null, 2)}`);
    }

    switch (contentSchema?.type) {
      case ContentType.SINGLETON:
        return this.persistence.putSingleton(store, document);
      case ContentType.COLLECTION:
        const idField = contentSchema.fields.filter(field => field.type === 'id');
        const documentId: string = idField.length
            ? document[idField[0].name] // TODO: handle cases when id is not a required field
            : generateId(store + '-');
        return this.persistence.putToCollection(store, documentId, document);
      case ContentType.TREE:
        // TODO: code save to the tree
        return Promise.resolve();
    }
  }
}
