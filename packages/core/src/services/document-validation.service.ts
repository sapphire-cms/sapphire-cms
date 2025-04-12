import {inject, singleton} from 'tsyringe';
import {ContentSchema, FieldSchema, makeHiddenCollectionName} from '../loadables';
import {SafeParseError, SafeParseSuccess, z, ZodTypeAny} from 'zod';
import {getFieldTypeMetadataFromInstance, ManagementLayer} from '../layers';
import {IValidator, toZodRefinement} from '../common';
import {FieldTypeService} from './field-type.service';
import {DI_TOKENS} from '../kernel';
import {ContentSchemasLoaderService} from './content-schemas-loader.service';

@singleton()
export class DocumentValidationService {
  private readonly documentValidators = new Map<string, ZodTypeAny>();

  public constructor(@inject(ContentSchemasLoaderService) private readonly schemasLoader: ContentSchemasLoaderService,
                     @inject(FieldTypeService) private readonly fieldTypeService: FieldTypeService,
                     @inject(DI_TOKENS.ManagementLayer) private readonly managementLayer: ManagementLayer<any>) {

    // TODO: validate the document and send the validation result instead
    this.managementLayer.getDocumentSchemaPort.accept(async store => {
      return this.documentValidators.get(store);
    });
  }

  public async afterInit(): Promise<void> {
    (await this.schemasLoader.getAllContentSchemas())
        .forEach(contentSchema => this.documentValidators.set(
            contentSchema.name, this.createDocumentValidator(contentSchema)));
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
      shape[fieldSchema.name] = this.createDocumentFieldValidator(fieldSchema, contentSchema);
    }

    return z.object(shape);
  }

  private createDocumentFieldValidator(contentFieldSchema: FieldSchema, contentSchema: ContentSchema): ZodTypeAny {
    let fieldType: IValidator<any>;
    if (contentFieldSchema.type === 'group') {
      fieldType = this.fieldTypeService.resolveFieldType({
        name: 'group',
        params: {
          'hidden-collection': makeHiddenCollectionName(contentSchema.name, contentFieldSchema.name),
        },
      });
    } else {
      fieldType = this.fieldTypeService.resolveFieldType(contentFieldSchema.type);
    }

    const metadata = getFieldTypeMetadataFromInstance(fieldType);
    const fieldTypeValidator = toZodRefinement(value => fieldType.validate(value));

    let ZFieldSchema: ZodTypeAny;

    switch (metadata!.castTo) {
      case 'string':
        ZFieldSchema = contentFieldSchema.isList
            ? z.array(z.string().superRefine(fieldTypeValidator))
            : z.string().superRefine(fieldTypeValidator);
        break;
      case 'number':
        ZFieldSchema = contentFieldSchema.isList
            ? z.array(z.number().superRefine(fieldTypeValidator))
            : z.number().superRefine(fieldTypeValidator);
        break;
      case 'boolean':
        ZFieldSchema = contentFieldSchema.isList
            ? z.array(z.boolean().superRefine(fieldTypeValidator))
            : z.boolean().superRefine(fieldTypeValidator);
        break;
    }

    if (!contentFieldSchema.required) {
      ZFieldSchema = ZFieldSchema!.optional();
    }

    // TODO: add field validators

    return ZFieldSchema!;
  }
}
