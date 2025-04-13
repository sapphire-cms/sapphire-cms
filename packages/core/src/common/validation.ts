import {RefinementCtx} from 'zod/lib/types';
import {z} from 'zod';
import {DocumentContent} from './document';

export class ValidationResult {
  public static valid(): ValidationResult {
    return new ValidationResult();
  }

  public static invalid(...errors: string[]): ValidationResult {
    return new ValidationResult(errors);
  }

  private constructor(public readonly errors: string[] = []) {
  }

  public get isValid(): boolean {
    return this.errors.length === 0;
  }
}

export type Validator<T> = (value: T) => ValidationResult;

export interface IValidator<T> {
  validate: Validator<T>;
}

export function toZodRefinement<T>(validator: Validator<T>): (value: T, ctx: RefinementCtx) => void {
  return (value, ctx) => {
    const result = validator(value);

    if (!result.isValid) {
      for (const error of result.errors) {
        // TODO: use a full ZOD potential for error handling
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: error,
        });
      }
    }
  };
}

export type FieldsValidationResult<T extends DocumentContent> = {
  [K in keyof T]: ValidationResult;
};

export class ContentValidationResult<T extends DocumentContent> {
  public constructor(public readonly fields: FieldsValidationResult<T>) {
  }

  public get isValid(): boolean {
    return Object.values(this.fields).every(validationResult => validationResult.isValid);
  }
}

export type ContentValidator<T extends DocumentContent> = (content: T) => ContentValidationResult<T>;
