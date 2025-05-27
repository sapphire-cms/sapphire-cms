import { idValidator, ValidationResult, Validator } from '../common';

export const DEFAULT_MODULE = 'default';

export type ModuleReference = string & { __brand: 'ModuleReference' };

export const moduleRefValidator: Validator<string> = (value: string): ValidationResult => {
  if (!value.startsWith('@')) {
    return ValidationResult.invalid('Module reference should start with character "@".');
  }

  const parts = value.slice(1).split('/');

  if (!parts[0].length) {
    return ValidationResult.invalid('Module name is required');
  }

  if (parts.length > 2) {
    return ValidationResult.invalid('Only one optional capability');
  }

  const partsErrors: string[] = [];

  for (const part of parts) {
    const validationResult = idValidator(part);
    partsErrors.push(...validationResult.errors);
  }

  return !partsErrors.length ? ValidationResult.valid() : ValidationResult.invalid(...partsErrors);
};

export function isModuleRef(value: unknown): value is ModuleReference {
  if (typeof value !== 'string') {
    return false;
  }

  return moduleRefValidator(value).isValid;
}

export function createModuleRef(module: string, capability?: string): ModuleReference {
  let ref = `@${module}`;

  if (capability) {
    if (module === DEFAULT_MODULE) {
      ref = capability;
    } else {
      ref += `/${capability}`;
    }
  }

  return ref as ModuleReference;
}

export function parseModuleRef(str: string): [module: string, capability?: string] {
  const raw = str.slice(1);
  return raw.split('/') as [module: string, capability?: string];
}
