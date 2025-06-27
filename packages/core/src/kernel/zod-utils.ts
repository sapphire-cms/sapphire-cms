import { z, RefinementCtx } from 'zod';
import { Validator } from '../common';

export function toZodRefinement<T>(
  validator: Validator<T>,
): (value: T, ctx: RefinementCtx) => void {
  return (value, ctx) => {
    const result = validator(value);

    if (!result.isValid) {
      for (const error of result.errors) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: error,
        });
      }
    }
  };
}

export function skipUndefined<T>(
  delegate: (value: T, ctx: RefinementCtx) => void,
): (value: T, ctx: RefinementCtx) => void {
  return (value, ctx) => {
    if (value === undefined || value === null) {
      return;
    }

    delegate(value, ctx);
  };
}
