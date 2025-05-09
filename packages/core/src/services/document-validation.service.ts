import { inject, singleton } from 'tsyringe';
import { z, ZodTypeAny } from 'zod';
import { AnyParams, AnyParamType, toZodRefinement, ValidationResult } from '../common';
import { err, ok, success, Result, SafeProgram, safeProgram } from '../defectless';
import { DI_TOKENS } from '../kernel';
import { ManagementLayer } from '../layers';
import {
  ContentValidationResult,
  ContentValidator,
  DocumentContent,
  FieldsValidationResult,
  HydratedContentSchema,
  HydratedFieldSchema,
  IFieldType,
  makeHiddenCollectionName,
  UnknownContentTypeError,
  UnknownFieldTypeError,
} from '../model';
import { CmsContext } from './cms-context';
import { FieldTypeService } from './field-type.service';

@singleton()
export class DocumentValidationService {
  private readonly documentValidators = new Map<string, ContentValidator>();

  constructor(
    @inject(CmsContext) private readonly cmsContext: CmsContext,
    @inject(FieldTypeService) private readonly fieldTypeService: FieldTypeService,
    @inject(DI_TOKENS.ManagementLayer) private readonly managementLayer: ManagementLayer<AnyParams>,
  ) {
    this.managementLayer.validateContentPort.accept((store, content) => {
      return this.validateDocumentContent(store, content).asyncAndThen((validationResult) =>
        success(validationResult),
      );
    });
  }

  public async afterInit(): Promise<void> {
    for (const contentSchema of this.cmsContext.allContentSchemas.values()) {
      this.createDocumentValidator(contentSchema).match(
        (documentValidator) => this.documentValidators.set(contentSchema.name, documentValidator),
        (err) => console.error(err),
      );
    }
  }

  public validateDocumentContent(
    store: string,
    content: DocumentContent,
  ): Result<ContentValidationResult, UnknownContentTypeError> {
    const documentValidator = this.documentValidators.get(store);
    if (!documentValidator) {
      return err(new UnknownContentTypeError(store));
    }

    return ok(documentValidator(content));
  }

  private createDocumentValidator(
    contentSchema: HydratedContentSchema,
  ): Result<ContentValidator, UnknownFieldTypeError> {
    return safeProgram(
      function* (): SafeProgram<ContentValidator, UnknownFieldTypeError> {
        const shape: Record<string, ZodTypeAny> = {};

        for (const fieldSchema of contentSchema.fields) {
          shape[fieldSchema.name] = yield this.createDocumentFieldValidator(
            fieldSchema,
            contentSchema,
          );
        }

        const zod = z.object(shape);

        return (content: DocumentContent): ContentValidationResult => {
          const parseResult = zod.safeParse(content);

          const issues = new Map<string, string[]>();
          for (const zodIssue of parseResult.error?.issues || []) {
            const field = zodIssue.path[0] as string;
            const message = zodIssue.message;

            const fieldIssues = issues.get(field);
            issues.set(field, fieldIssues ? [...fieldIssues, message] : [message]);
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
      },
      (_defect) => err(new UnknownFieldTypeError('Defective createDocumentValidator program')),
      this,
    );
  }

  private createDocumentFieldValidator(
    contentFieldSchema: HydratedFieldSchema,
    contentSchema: HydratedContentSchema,
  ): Result<ZodTypeAny, UnknownFieldTypeError> {
    return safeProgram(
      function* (): SafeProgram<ZodTypeAny, UnknownFieldTypeError> {
        let fieldType: IFieldType;

        if (contentFieldSchema.type.name === 'group') {
          fieldType = yield this.fieldTypeService.resolveFieldType({
            name: 'group',
            params: {
              'hidden-collection': makeHiddenCollectionName(
                contentSchema.name,
                contentFieldSchema.name,
              ),
            },
          });
        } else {
          fieldType = yield this.fieldTypeService.resolveFieldType(contentFieldSchema.type);
        }

        const fieldTypeValidator = toZodRefinement((value: AnyParamType) =>
          fieldType.validate(value),
        );

        let ZFieldSchema: ZodTypeAny;

        switch (fieldType.castTo) {
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
      },
      // TODO: find a better way to handle defects
      (_defect) => err(new UnknownFieldTypeError('Defective createDocumentFieldValidator program')),
      this,
    );
  }
}
