import { failure, Outcome, program, success, SyncOutcome, SyncProgram } from 'defectless';
import { inject, singleton } from 'tsyringe';
import { z, ZodTypeAny } from 'zod';
import { AnyParams, AnyParamType, toZodRefinement, ValidationResult } from '../common';
import { CoreCmsError, DI_TOKENS } from '../kernel';
import { ManagementLayer } from '../layers';
import {
  ContentValidationResult,
  ContentValidator,
  DocumentContent,
  FieldsValidationResult,
  HydratedContentSchema,
  HydratedFieldSchema,
  IFieldType,
  IFieldValidator,
  makeHiddenCollectionName,
  UnknownContentTypeError,
  UnknownFieldTypeError,
  UnknownFieldValidatorError,
} from '../model';
import { CmsContext } from './cms-context';

@singleton()
export class DocumentValidationService {
  private readonly documentValidators = new Map<string, ContentValidator>();

  constructor(
    @inject(CmsContext) private readonly cmsContext: CmsContext,
    @inject(DI_TOKENS.ManagementLayer) private readonly managementLayer: ManagementLayer<AnyParams>,
  ) {
    this.managementLayer.validateContentPort.accept((store, content) => {
      return this.validateDocumentContent(store, content).flatMap((validationResult) =>
        success(validationResult),
      );
    });
  }

  public afterInit(): SyncOutcome<void, CoreCmsError> {
    const tasks: SyncOutcome<
      ContentValidator,
      UnknownFieldTypeError | UnknownFieldValidatorError | CoreCmsError
    >[] = [];

    for (const contentSchema of this.cmsContext.allContentSchemas.values()) {
      const task = this.createDocumentValidator(contentSchema).tap((documentValidator) =>
        this.documentValidators.set(contentSchema.name, documentValidator),
      );
      tasks.push(task);
    }

    return Outcome.all(tasks)
      .map(() => {})
      .mapFailure((errors) => {
        const message = errors
          .filter((error) => !!error)
          .map((error) => error!.message)
          .join('\n');
        return new CoreCmsError(message);
      });
  }

  public validateDocumentContent(
    store: string,
    content: DocumentContent,
  ): Outcome<ContentValidationResult, UnknownContentTypeError> {
    const documentValidator = this.documentValidators.get(store);
    if (!documentValidator) {
      return failure(new UnknownContentTypeError(store));
    }

    return success(documentValidator(content));
  }

  private createDocumentValidator(
    contentSchema: HydratedContentSchema,
  ): SyncOutcome<
    ContentValidator,
    UnknownFieldTypeError | UnknownFieldValidatorError | CoreCmsError
  > {
    return program(function* (): SyncProgram<
      ContentValidator,
      UnknownFieldTypeError | UnknownFieldValidatorError | CoreCmsError
    > {
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
    }, this);
  }

  private createDocumentFieldValidator(
    contentFieldSchema: HydratedFieldSchema,
    contentSchema: HydratedContentSchema,
  ): SyncOutcome<ZodTypeAny, UnknownFieldTypeError | UnknownFieldValidatorError | CoreCmsError> {
    return program(function* (): SyncProgram<
      ZodTypeAny,
      UnknownFieldTypeError | UnknownFieldValidatorError | CoreCmsError
    > {
      let fieldType: IFieldType;

      if (contentFieldSchema.type.name === 'group') {
        fieldType = yield this.cmsContext.createFieldType({
          name: 'group',
          params: {
            'hidden-collection': makeHiddenCollectionName(
              contentSchema.name,
              contentFieldSchema.name,
            ),
          },
        });
      } else {
        fieldType = yield this.cmsContext.createFieldType(contentFieldSchema.type);
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

      if (contentFieldSchema.required) {
        const requiredValidator: IFieldValidator<AnyParamType> =
          yield this.cmsContext.createFieldValidator({
            name: 'required',
            params: {},
          });
        ZFieldSchema = ZFieldSchema.superRefine(
          toZodRefinement((val) => requiredValidator.validate(val)),
        );
      } else {
        ZFieldSchema = ZFieldSchema!.optional();
      }

      for (const validator of contentFieldSchema.validation) {
        if (validator.forTypes.includes(fieldType.castTo)) {
          ZFieldSchema = ZFieldSchema.superRefine(
            toZodRefinement((val) => validator.validate(val)),
          );
        } else {
          return failure(
            new CoreCmsError(
              `Validator ${validator.name} cannot be applied on the field ${contentFieldSchema.name} of type ${fieldType.name}`,
            ),
          );
        }
      }

      return ZFieldSchema!;
    }, this);
  }
}
