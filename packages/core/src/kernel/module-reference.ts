import {idValidator} from '../common';

export const DEFAULT_MODULE = 'default';

export type ModuleReference = string & { __brand: 'ModuleReference' };

export function isModuleRef(value: unknown): value is ModuleReference {
  if (typeof value !== 'string') {
    return false;
  }

  if (!value.startsWith('@')) {
    return false;
  }

  const parts = value.slice(1).split('/');

  if (parts.length === 0) {
    return false;
  }

  if (!parts[0].length) {
    return false;   // module name is required
  }

  if (parts.length > 2) {
    return false;   // only one optional capability
  }

  for (const part of parts) {
    const validationResult = idValidator(part);
    if (!validationResult.isValid) {
      return false;
    }
  }

  return true;
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

export function parseModuleRef(str: string): [ module: string, capability?: string ] {
  if (!isModuleRef(str)) {
    throw new Error(`String "${str}" is not a module reference`);
  }

  const raw = str.slice(1);
  return raw.split('/') as [ module: string, capability?: string ];
}
