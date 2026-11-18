import { failure, Outcome, success, SyncOutcome } from 'defectless';
import { inject, singleton } from 'tsyringe';
import { z } from 'zod/mini';
import { AnyParamType, skipUndefined, toZodRefinement, ValidationResult } from '../common';
import {
  capability,
  CapabilityReferenceKey,
  CoreCmsError,
  DEFAULT_MODULE_REF,
  Id,
} from '../kernel';
import {
  ContentValidationResult,
  ContentValidator,
  DocumentContent,
  FieldsValidationResult,
  HydratedContentSchema,
  HydratedFieldSchema,
  UnknownContentTypeError,
} from '../model';
import { CmsContext } from './cms-context';

@singleton()
export class DocumentValidationService {
  private readonly documentValidators = new Map<CapabilityReferenceKey, ContentValidator>();

  constructor(@inject(CmsContext) private readonly cmsContext: CmsContext) {}

  public afterInit(): SyncOutcome<void, CoreCmsError> {
    for (const contentSchema of this.cmsContext.allContentSchemas.values()) {
      const documentValidator = this.createDocumentValidator(contentSchema);
      this.documentValidators.set(contentSchema.ref.key, documentValidator);
    }

    return success();
  }

  public validateDocumentContent(
    store: Id,
    content: DocumentContent,
  ): Outcome<ContentValidationResult, UnknownContentTypeError> {
    const documentValidator = this.documentValidators.get(
      DEFAULT_MODULE_REF.withCapability(store).key,
    );
    if (!documentValidator) {
      return failure(new UnknownContentTypeError(store));
    }

    return success(documentValidator(content));
  }

  private createDocumentValidator(contentSchema: HydratedContentSchema): ContentValidator {
    const shape: Record<string, z.ZodMiniType> = {};

    for (const fieldSchema of contentSchema.fields) {
      shape[fieldSchema.name] = this.createDocumentFieldValidator(fieldSchema);
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
  }

  private createDocumentFieldValidator(contentFieldSchema: HydratedFieldSchema): z.ZodMiniType {
    const fieldType = contentFieldSchema.type;

    const required =
      contentFieldSchema.required ||
      contentFieldSchema.validation
        .map((validator) => validator.ref.key)
        .includes(capability`required`);

    let ZFieldSchema: z.ZodMiniType<AnyParamType | undefined>;

    switch (fieldType.castTo) {
      case 'string':
        ZFieldSchema = z.pipe(
          z.transform((val: AnyParamType | undefined) =>
            typeof val === 'string' && val.trim() === '' ? undefined : val,
          ),
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

    if (!required) {
      ZFieldSchema = z.optional(ZFieldSchema);
    }

    const fieldTypeValidator = toZodRefinement((value: AnyParamType) => fieldType.validate(value));
    ZFieldSchema = ZFieldSchema.check(z.superRefine(skipUndefined(fieldTypeValidator)));

    for (const validator of contentFieldSchema.validation) {
      ZFieldSchema = ZFieldSchema.check(
        z.superRefine(
          toZodRefinement((value: AnyParamType | undefined) => validator.validate(value)),
        ),
      );
    }

    return contentFieldSchema.isList ? z.array(ZFieldSchema!) : ZFieldSchema!;
  }
}
