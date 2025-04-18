import {idValidator} from './ids';

export type ModuleReference = [ module: string, capability?: string ];

export function isModuleRef(str: string): boolean {
  return str.startsWith('@');
}

export function parseModuleRef(str: string): ModuleReference {
  if (!isModuleRef(str)) {
    throw new Error(`Module reference should start with character '@': "${str}"`);
  }

  const raw = str.slice(1);
  const tokens = raw.split('/');

  if (tokens.length > 2) {
    throw new Error(`Module reference can have maximum 2 parts separated by character '/': "${str}"`);
  }

  for (const token of tokens) {
    const validationRes = idValidator(token);
    if (!validationRes.isValid) {
      throw new Error(validationRes.errors.join('\n'));
    }
  }

  return tokens as ModuleReference;
}
