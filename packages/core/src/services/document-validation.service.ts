import {inject, singleton} from 'tsyringe';
import {z, ZodTypeAny} from 'zod';
import {AnyParams, AnyParamType, toZodRefinement, ValidationResult} from '../common';
import {DI_TOKENS} from '../kernel';
import {ManagementLayer} from '../layers';
import {
  ContentValidationResult,
  ContentValidator,
  DocumentContent,
  FieldsValidationResult,
  HydratedContentSchema,
  HydratedFieldSchema,
  IFieldType,
  makeHiddenCollectionName
} from '../model';
import {CmsContext} from './cms-context';
import {FieldTypeService} from './field-type.service';

@singleton()
export class DocumentValidationService {
  private readonly documentValidators = new Map<string, ContentValidator>();

  public constructor(@inject(CmsContext) private readonly cmsContext: CmsContext,
                     @inject(FieldTypeService) private readonly fieldTypeService: FieldTypeService,
                     @inject(DI_TOKENS.ManagementLayer) private readonly managementLayer: ManagementLayer<AnyParams>) {
    this.managementLayer.validateContentPort.accept(async (store, content) => {
      return this.validateDocumentContent(store, content);
    });
  }

  public async afterInit(): Promise<void> {
    for (const contentSchema of this.cmsContext.allContentSchemas.values()) {
      const documentValidator = this.createDocumentValidator(contentSchema);
      this.documentValidators.set(contentSchema.name, documentValidator);
    }
  }

  public validateDocumentContent(store: string, content: DocumentContent): ContentValidationResult {
    const documentValidator = this.documentValidators.get(store);
    if (!documentValidator) {
      throw new Error(`Unknown content type: "${store}"`);
    }

    return documentValidator(content);
  }

  private createDocumentValidator(contentSchema: HydratedContentSchema): ContentValidator {
    const shape: Record<string, ZodTypeAny> = {};

    for (const fieldSchema of contentSchema.fields) {
      shape[fieldSchema.name] = this.createDocumentFieldValidator(fieldSchema, contentSchema);
    }

    const zod = z.object(shape);

    return (content: DocumentContent): ContentValidationResult => {
      const parseResult = zod.safeParse(content);

      const issues = new Map<string, string[]>();
      for (const zodIssue of parseResult.error?.issues || []) {
        const field = zodIssue.path[0] as string;
        const message = zodIssue.message;

        const fieldIssues = issues.get(field);
        issues.set(field, fieldIssues ? [ ...fieldIssues, message ] : [ message ]);
      }

      const fieldsValidationResult: FieldsValidationResult = {};

      for (const fieldSchema of contentSchema.fields) {
        const fieldIssues = issues.get(fieldSchema.name);
        fieldsValidationResult[fieldSchema.name] = fieldIssues
            ? ValidationResult.invalid(...fieldIssues)
            : ValidationResult.valid();
      }

      return new ContentValidationResult(fieldsValidationResult);
    };
  }

  private createDocumentFieldValidator(contentFieldSchema: HydratedFieldSchema, contentSchema: HydratedContentSchema): ZodTypeAny {
    let fieldType: IFieldType;
    if (contentFieldSchema.type.name === 'group') {
      fieldType = this.fieldTypeService.resolveFieldType({
        name: 'group',
        params: {
          'hidden-collection': makeHiddenCollectionName(contentSchema.name, contentFieldSchema.name),
        },
      });
    } else {
      fieldType = this.fieldTypeService.resolveFieldType(contentFieldSchema.type);
    }

    const fieldTypeValidator = toZodRefinement((value: AnyParamType) => fieldType.validate(value));

    let ZFieldSchema: ZodTypeAny;

    switch (fieldType!.castTo) {
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
