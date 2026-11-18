import { ValidationResult, Validator } from '../common';
import { CapabilityReference } from './capability-reference';
import { asId, id, Id, idValidator } from './id';

export const DEFAULT_MODULE_NAME = id`default`;

export type ModuleReferenceKey = string & { __brand: 'ModuleReference' };

export function asModule(value: string): ModuleReferenceKey {
  return value as ModuleReferenceKey;
}

export function module(strings: TemplateStringsArray, ...values: unknown[]): ModuleReferenceKey {
  return String.raw({ raw: strings }, ...values) as ModuleReferenceKey;
}

export class ModuleReference {
  public static parse(str: string): ModuleReference {
    return new ModuleReference(asId(str.slice(1)));
  }

  public static validate: Validator<string> = (value: string): ValidationResult => {
    if (!value.startsWith('@')) {
      return ValidationResult.invalid('Module reference should start with "@"');
    }

    const moduleName = value.slice(1);

    if (!moduleName.length) {
      return ValidationResult.invalid('Module name is required');
    }

    return idValidator(moduleName);
  };

  public static isModuleRef(value: unknown): value is ModuleReferenceKey {
    if (typeof value !== 'string') {
      return false;
    }

    return ModuleReference.validate(value).isValid;
  }

  constructor(public readonly module: Id) {}

  public withCapability(capability: Id): CapabilityReference {
    return new CapabilityReference(this.module, capability);
  }

  public get key(): ModuleReferenceKey {
    return module`@${this.module}`;
  }

  public is(module: string): boolean {
    return this.module === module;
  }

  public toString(): ModuleReferenceKey {
    return this.key;
  }
}

export const DEFAULT_MODULE_REF = new ModuleReference(DEFAULT_MODULE_NAME);
