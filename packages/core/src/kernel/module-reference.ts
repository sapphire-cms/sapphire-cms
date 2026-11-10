import { idValidator, ValidationResult, Validator } from '../common';

export const DEFAULT_MODULE = 'default';

export type ModuleReference = string & { __brand: 'ModuleReference' };

export const moduleRefValidator: Validator<string> = (value: string): ValidationResult => {
  let parts: string[];

  if (value.startsWith('@')) {
    // Reference from plugged module
    parts = value.slice(1).split('/');

    if (!parts[0].length) {
      return ValidationResult.invalid('Module name is required');
    }

    if (parts.length > 2) {
      return ValidationResult.invalid('Only one optional capability');
    }
  } else {
    // Reference from default module
    parts = value.split('/');

    if (parts.length > 1) {
      return ValidationResult.invalid('Only one optional capability');
    }
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
  if (str.startsWith('@')) {
    // Reference from plugged module
    const raw = str.slice(1);
    return raw.split('/') as [module: string, capability?: string];
  } else {
    // Reference from default module
    return ['default', str];
  }
}
