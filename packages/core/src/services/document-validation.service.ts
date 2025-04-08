import {inject, singleton} from 'tsyringe';
import {ContentSchema, FieldSchema} from '../loadables';
import {SafeParseError, SafeParseSuccess, z, ZodTypeAny} from 'zod';
import {BootstrapLayer, getFieldTypeMetadataFromInstance, ManagementLayer} from '../layers';
import {toZodRefinement} from '../common';
import {FieldTypeService} from './field-type.service';
import {DI_TOKENS} from '../kernel';

@singleton()
export class DocumentValidationService {
  private readonly documentValidators = new Map<string, ZodTypeAny>();

  public constructor(@inject(FieldTypeService) private readonly fieldTypeService: FieldTypeService,
                     @inject(DI_TOKENS.BootstrapLayer) private readonly bootstrap: BootstrapLayer<any>,
                     @inject(DI_TOKENS.ManagementLayer) private readonly managementLayer: ManagementLayer<any>) {

    // TODO: validate the document and send the validation result instead
    this.managementLayer.getDocumentSchemaPort.accept(async store => {
      return this.documentValidators.get(store);
    });
  }

  public afterInit(): Promise<void> {
    return this.bootstrap.getAllContentSchemas().then(contentSchemas => {
      const prepareStoresPromises: Promise<void>[] = [];

      // Create document validators
      for (const contentSchema of contentSchemas) {
        this.documentValidators.set(contentSchema.name, this.createDocumentValidator(contentSchema));
      }

      return Promise.all(prepareStoresPromises);
    }).then(() => {});
  }

  public validateDocument(store: string, document: any): SafeParseSuccess<any> | SafeParseError<any> {
    const documentValidator = this.documentValidators.get(store);
    if (!documentValidator) {
      throw new Error(`Unknown content type: "${store}"`);
    }

    return documentValidator.safeParse(document);
  }

  private createDocumentValidator(contentSchema: ContentSchema): ZodTypeAny {
    const shape: Record<string, ZodTypeAny> = {};

    for (const fieldSchema of contentSchema.fields) {
      shape[fieldSchema.name] = this.createDocumentFieldValidator(fieldSchema);
    }

    return z.object(shape);
  }

  private createDocumentFieldValidator(contentFieldSchema: FieldSchema): ZodTypeAny {
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

    ZFieldSchema = ZFieldSchema!.superRefine(toZodRefinement(value => fieldType.validate(value)));

    // TODO: add field validators

    return ZFieldSchema;
  }
}
