import { z } from 'zod/mini';
import { Validator } from '../common';

export function toZodRefinement<T>(
  validator: Validator<T>,
): (value: T, ctx: z.core.ParsePayload<T>) => void {
  return (value, ctx) => {
    const result = validator(value);

    if (!result.isValid) {
      for (const error of result.errors) {
        ctx.issues.push({
          code: 'custom',
          message: error,
          input: value,
        });
      }
    }
  };
}

export function skipUndefined<T>(
  delegate: (value: T, ctx: z.core.ParsePayload<T>) => void,
): (value: T | undefined, ctx: z.core.ParsePayload<T | undefined>) => void {
  return (value, ctx) => {
    if (value === undefined || value === null) {
      return;
    }

    delegate(value as T, ctx as z.core.ParsePayload<T>);
  };
}
