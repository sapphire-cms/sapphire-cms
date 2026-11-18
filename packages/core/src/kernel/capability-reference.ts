import { ValidationResult, Validator } from '../common';
import { asId, Id, idValidator } from './id';
import { DEFAULT_MODULE_NAME } from './module-reference';

export type CapabilityReferenceKey = string & { __brand: 'CapabilityReference' };

export function asCapability(value: string): CapabilityReferenceKey {
  return value as CapabilityReferenceKey;
}

export function capability(
  strings: TemplateStringsArray,
  ...values: unknown[]
): CapabilityReferenceKey {
  return String.raw({ raw: strings }, ...values) as CapabilityReferenceKey;
}

export class CapabilityReference {
  public static parse(str: string): CapabilityReference {
    if (str.startsWith('@')) {
      // Reference from plugged module
      const raw = str.slice(1);
      const [module, capability] = raw.split('/');
      return new CapabilityReference(asId(module), asId(capability));
    } else {
      // Reference from default module
      return new CapabilityReference(DEFAULT_MODULE_NAME, asId(str));
    }
  }

  public static validate: Validator<string> = (value: string): ValidationResult => {
    let parts: string[];

    if (value.startsWith('@')) {
      // Reference from plugged module
      parts = value.slice(1).split('/');

      if (parts.length < 2) {
        return ValidationResult.invalid('Module name and capability name are both required');
      }

      if (parts.length > 2) {
        return ValidationResult.invalid('Only module name and capability name are allowed');
      }
    } else {
      // Reference from default module
      parts = value.split('/');

      if (parts.length > 1) {
        return ValidationResult.invalid('Only one capability is allowed');
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

  public static isCapabilityRef(value: unknown): value is CapabilityReferenceKey {
    if (typeof value !== 'string') {
      return false;
    }

    return CapabilityReference.validate(value).isValid;
  }

  constructor(
    public readonly module: Id,
    public readonly capability: Id,
  ) {}

  public get key(): CapabilityReferenceKey {
    return (
      this.module === DEFAULT_MODULE_NAME ? this.capability : `@${this.module}/${this.capability}`
    ) as CapabilityReferenceKey;
  }

  public is(module: string, capability: string): boolean {
    return this.module === module && this.capability === capability;
  }

  public toString(): CapabilityReferenceKey {
    return this.key;
  }
}
