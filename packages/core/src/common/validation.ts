import { z } from 'zod';
import { RefinementCtx } from 'zod/lib/types';

export class ValidationResult {
  public static valid(): ValidationResult {
    return new ValidationResult();
  }

  public static invalid(...errors: string[]): ValidationResult {
    return new ValidationResult(errors);
  }

  private constructor(public readonly errors: string[] = []) {}

  public get isValid(): boolean {
    return this.errors.length === 0;
  }
}

export type Validator<T> = (value: T) => ValidationResult;

export interface IValidator<T> {
  validate: Validator<T>;
}

export function toZodRefinement<T>(
  validator: Validator<T>,
): (value: T, ctx: RefinementCtx) => void {
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
