import {idValidator, IValidator, ValidationResult} from '../../../../common';

export abstract class AbstractReference implements IValidator<string> {
  constructor(protected readonly params: { store: string; }) {
  }

  public validate(value: string): ValidationResult {
    const raw = value.trim();
    const parts = raw.split(':');

    if (parts.length < 2 || !parts[1].length) {
      return ValidationResult.invalid('Reference should contain at least store name and document id.');
    }

    if (parts[0] != this.params.store) {
      return ValidationResult.invalid(`Cannot reference documents from the store ${parts[0]}`);
    }

    const err: string[] = [];

    const pathTokens = parts[1].split('/');
    for (const pathToken of pathTokens) {
      if (!idValidator(pathToken)) {
        err.push(`Invalid path token: "${pathToken}"`);
      }
    }

    if (parts[2] && !idValidator(parts[2])) {
      err.push(`Invalid variant: "${parts[2]}"`);
    }

    return err.length
        ? ValidationResult.invalid(...err)
        : ValidationResult.valid();
  }
}
