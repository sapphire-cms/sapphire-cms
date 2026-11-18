import { ValidationResult, Validator } from '../common';
import { Id, idValidator } from './id';

export type Slug = string & { __brand: 'Slug' };

export function asSlug(value: string): Slug {
  return value as Slug;
}

export function slug(strings: TemplateStringsArray, ...values: unknown[]): Slug {
  return String.raw({ raw: strings }, ...values) as Slug;
}

export function createSlug(...parts: Id[]): Slug {
  return parts.join('/') as Slug;
}

export const slugValidator: Validator<string> = (value: string): ValidationResult => {
  const parts = value.split('/');

  if (!parts.length) {
    return ValidationResult.invalid('Slug should contain at least one element');
  }

  const partsErrors: string[] = [];

  for (const part of parts) {
    const validationResult = idValidator(part);
    partsErrors.push(...validationResult.errors);
  }

  return !partsErrors.length ? ValidationResult.valid() : ValidationResult.invalid(...partsErrors);
};
