import {BootstrapLayer} from '../layers/bootstrap.layer';
import {PersistenceLayer} from '../layers/persistence.layer';
import {ContentSchema, ContentType, FieldSchema} from '../model/content-schema';
import {z, ZodTypeAny} from 'zod';
import {FieldTypeService} from './field-type.service';
import {toZodRefinement} from '../common/validation';
import {generateId} from '../common/ids';

export class ContentService {
  private readonly contentSchemas = new Map<string, ContentSchema>();
  private readonly documentSchemas = new Map<string, ZodTypeAny>();

  private readonly serviceReady: Promise<void>;

  constructor(private readonly fieldTypeService: FieldTypeService,
              private readonly bootstrap: BootstrapLayer<any>,
              private readonly persistence: PersistenceLayer<any>) {
    this.serviceReady = this.bootstrap.getAllSchemas().then(contentSchemas => {
      const prepareStoresPromises: Promise<void>[] = [];

      for (const contentSchema of contentSchemas) {
        this.contentSchemas.set(contentSchema.name, contentSchema);
        this.documentSchemas.set(contentSchema.name, this.createDocumentSchema(contentSchema));

        prepareStoresPromises.push(this.persistence.prepareStore(contentSchema));
      }

      return Promise.all(prepareStoresPromises);
    }).then(() => {});
  }

  public async saveDocument(schemaName: string, document: any): Promise<void> {
    await this.serviceReady;

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

    let ZFieldSchema: ZodTypeAny;

    switch (fieldType.castTo) {
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

    ZFieldSchema = ZFieldSchema!.superRefine(toZodRefinement(fieldType.isValueOfType));

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
