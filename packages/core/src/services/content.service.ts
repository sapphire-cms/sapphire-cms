import {z, ZodTypeAny} from 'zod';
import {FieldTypeService} from './field-type.service';
import {ContentType, generateId, toZodRefinement} from '../common';
import {BootstrapLayer} from '../layers/bootstrap';
import {PersistenceLayer} from '../layers/persistence';
import {ContentSchema, FieldSchema} from '../loadables';
import {getFieldTypeMetadataFromClass, getFieldTypeMetadataFromInstance} from '../layers/content/fields-typing';
import {inject, singleton} from 'tsyringe';
import {AfterInitAware, DI_TOKENS} from '../kernel';
import {ManagementLayer} from '../layers/management/management.layer';
import {SapphireFieldTypeClass} from '../layers/content/fields-typing.types';
import {ContentLayer} from '../layers';

@singleton()
export class ContentService implements AfterInitAware {
  private readonly contentSchemas = new Map<string, ContentSchema>();
  private readonly fieldTypeFactories = new Map<string, SapphireFieldTypeClass<any, any>>
  private readonly documentSchemas = new Map<string, ZodTypeAny>();

  constructor(private readonly fieldTypeService: FieldTypeService,
              @inject(DI_TOKENS.ContentLayer) private readonly contentLayer: ContentLayer<any>,
              @inject(DI_TOKENS.BootstrapLayer) private readonly bootstrap: BootstrapLayer<any>,
              @inject(DI_TOKENS.PersistenceLayer) private readonly persistence: PersistenceLayer<any>,
              @inject(DI_TOKENS.ManagementLayer) private readonly managementLayer: ManagementLayer<any>) {
    // Load field types classes
    for (const fieldTypeFactory of this.contentLayer.fieldTypeFactories || []) {
      const meta = getFieldTypeMetadataFromClass(fieldTypeFactory);
      if (meta) {
        this.fieldTypeFactories.set(meta.name, fieldTypeFactory);
      }
    }

    this.managementLayer.getContentSchemaPort.accept(async storeName => {
      if (!this.contentSchemas.has(storeName)) {
        throw new Error(`Unknown content store: "${storeName}"`);
      }

      return this.contentSchemas.get(storeName)!;
    });

    this.managementLayer.getTypeFactoriesPort.accept(async () => {
      return Object.freeze(new Map(this.fieldTypeFactories));
    });
  }

  public afterInit(): Promise<void> {
    return this.bootstrap.getAllSchemas().then(contentSchemas => {
      const prepareStoresPromises: Promise<void>[] = [];

      // Load content schemas
      for (const contentSchema of contentSchemas) {
        this.contentSchemas.set(contentSchema.name, contentSchema);
        // this.documentSchemas.set(contentSchema.name, this.createDocumentSchema(contentSchema));

        prepareStoresPromises.push(this.persistence.prepareStore(contentSchema));
      }

      return Promise.all(prepareStoresPromises);
    }).then(() => {});
  }

  public async saveDocument(schemaName: string, document: any): Promise<void> {
    const contentSchema = this.contentSchemas.get(schemaName);
    if (!contentSchema) {
      throw new Error(`Unknown schema: "${schemaName}"`);
    }

    const documentSchema = this.documentSchemas.get(schemaName)!;
    const validationResult = documentSchema.safeParse(document);

    if (!validationResult.success) {
      throw new Error(
          `Document doesn't match the structure of schema "${schemaName}":
          ${JSON.stringify(validationResult.error.format(), null, 2)}`);
    }

    switch (contentSchema?.type) {
      case ContentType.SINGLETON:
        return this.persistence.putSingleton(schemaName, document);
      case ContentType.COLLECTION:
        const idField = contentSchema.fields.filter(field => field.type === 'id');
        const documentId: string = idField.length
            ? document[idField[0].name] // TODO: handle cases when id is not a required field
            : generateId(schemaName + '-');
        return this.persistence.putToCollection(schemaName, documentId, document);
      case ContentType.TREE:
        // TODO: code save to the tree
        return Promise.resolve();
    }
  }

  createDocumentFieldSchema(contentFieldSchema: FieldSchema): ZodTypeAny {
    const fieldType = this.fieldTypeService.resolveFieldType(contentFieldSchema.type);
    const metadata = getFieldTypeMetadataFromInstance(fieldType);

    let ZFieldSchema: ZodTypeAny;

    switch (metadata!.castTo) {
      case 'string':
        ZFieldSchema = contentFieldSchema.isList ? z.array(z.string()) : z.string();
        break;
      case 'number':
        ZFieldSchema = contentFieldSchema.isList ? z.array(z.number()) : z.number();
        break;
      case 'boolean':
        ZFieldSchema = contentFieldSchema.isList ? z.array(z.boolean()) : z.boolean();
        break;
    }

    if (!contentFieldSchema.required) {
      ZFieldSchema = ZFieldSchema!.optional();
    }

    ZFieldSchema = ZFieldSchema!.superRefine(toZodRefinement(fieldType.validate));

    // TODO: add field validators

    return ZFieldSchema;
  }

  createDocumentSchema(contentSchema: ContentSchema): ZodTypeAny {
    const shape: Record<string, ZodTypeAny> = {};

    for (const fieldSchema of contentSchema.fields) {
      shape[fieldSchema.name] = this.createDocumentFieldSchema(fieldSchema);
    }

    return z.object(shape);
  }
}
