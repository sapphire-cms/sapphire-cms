import { asId, id, Id, idValidator, ValidationResult, Validator } from '../common';

export const DEFAULT_MODULE_NAME = id`default`;

export type ModuleReferenceKey = string & { __brand: 'ModuleReference' };

export function asRef(value: string): ModuleReferenceKey {
  return value as ModuleReferenceKey;
}

export function moduleRef(strings: TemplateStringsArray, ...values: unknown[]): ModuleReferenceKey {
  return String.raw({ raw: strings }, ...values) as ModuleReferenceKey;
}

export class ModuleReference {
  public static parse(str: string): ModuleReference {
    if (str.startsWith('@')) {
      // Reference from plugged module
      const raw = str.slice(1);
      const [module, capability] = raw.split('/');
      return new ModuleReference(asId(module), asId(capability));
    } else {
      // Reference from default module
      return new ModuleReference(DEFAULT_MODULE_NAME, asId(str));
    }
  }

  public static validate: Validator<string> = (value: string): ValidationResult => {
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

    return !partsErrors.length
      ? ValidationResult.valid()
      : ValidationResult.invalid(...partsErrors);
  };

  public static isModuleRef(value: unknown): value is ModuleReferenceKey {
    if (typeof value !== 'string') {
      return false;
    }

    return ModuleReference.validate(value).isValid;
  }

  constructor(
    public readonly module: Id,
    public readonly capability?: Id,
  ) {}

  public withCapability(capability: Id): ModuleReference {
    return new ModuleReference(this.module, capability);
  }

  public get isModuleRef(): boolean {
    return !this.capability;
  }

  public get isCapabilityRef(): boolean {
    return !!this.capability;
  }

  public get key(): ModuleReferenceKey {
    let ref = `@${this.module}`;

    if (this.capability) {
      if (this.module === DEFAULT_MODULE_NAME) {
        ref = this.capability;
      } else {
        ref += `/${this.capability}`;
      }
    }

    return ref as ModuleReferenceKey;
  }

  public is(module: string, capability?: string): boolean {
    return this.module === module && this.capability === capability;
  }

  public toString(): ModuleReferenceKey {
    return this.key;
  }
}

export const DEFAULT_MODULE_REF = new ModuleReference(DEFAULT_MODULE_NAME);
