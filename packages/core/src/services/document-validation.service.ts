import { failure, Outcome, program, success, SyncOutcome, SyncProgram } from 'defectless';
import { inject, singleton } from 'tsyringe';
import { z, ZodTypeAny } from 'zod';
import { AnyParamType, ValidationResult } from '../common';
import { CoreCmsError, skipUndefined, toZodRefinement } from '../kernel';
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

  constructor(@inject(CmsContext) private readonly cmsContext: CmsContext) {}

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
        const fieldsValidationResult: FieldsValidationResult = {};

        for (const field of contentSchema.fields) {
          const fieldName = field.name;
          const fieldValue = content[fieldName];

          fieldsValidationResult[fieldName] = Array.isArray(fieldValue)
            ? Array.from({ length: fieldValue.length }, () => ValidationResult.valid())
            : [ValidationResult.valid()];
        }

        for (const zodIssue of parseResult.error?.issues || []) {
          const fieldName = zodIssue.path[0] as string;
          const itemIndex = zodIssue.path.length === 2 ? (zodIssue.path[1] as number) : 0;
          const message = zodIssue.message;

          const validationResult = fieldsValidationResult[fieldName][itemIndex];

          fieldsValidationResult[fieldName][itemIndex] = ValidationResult.invalid(
            ...validationResult.errors,
            message,
          );
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
          ZFieldSchema = z.preprocess(
            (val) => {
              return typeof val === 'string' && val.trim() === '' ? undefined : val;
            },
            z.union([z.string(), z.undefined()]),
          );
          break;
        case 'number':
          ZFieldSchema = z.number();
          break;
        case 'boolean':
          ZFieldSchema = z.boolean();
          break;
      }

      if (contentFieldSchema.required) {
        const requiredValidator: IFieldValidator = yield this.cmsContext.createFieldValidator({
          name: 'required',
          params: {},
        });
        ZFieldSchema = ZFieldSchema.superRefine(
          toZodRefinement((val) => requiredValidator.validate(val)),
        );
      } else {
        ZFieldSchema = ZFieldSchema!.optional();
      }

      switch (fieldType.castTo) {
        case 'string':
          ZFieldSchema = ZFieldSchema.superRefine(skipUndefined(fieldTypeValidator));
          break;
        case 'number':
          ZFieldSchema = ZFieldSchema.superRefine(skipUndefined(fieldTypeValidator));
          break;
        case 'boolean':
          ZFieldSchema = ZFieldSchema.superRefine(skipUndefined(fieldTypeValidator));
          break;
      }

      for (const validator of contentFieldSchema.validation) {
        if (validator.forTypes.includes(fieldType.castTo)) {
          ZFieldSchema = ZFieldSchema.superRefine(
            skipUndefined(toZodRefinement((val) => validator.validate(val))),
          );
        } else {
          return failure(
            new CoreCmsError(
              `Validator ${validator.name} cannot be applied on the field ${contentFieldSchema.name} of type ${fieldType.name}`,
            ),
          );
        }
      }

      return contentFieldSchema.isList ? z.array(ZFieldSchema!) : ZFieldSchema!;
    }, this);
  }
}
