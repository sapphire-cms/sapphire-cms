import { idValidator, ValidationResult, Validator } from '../../common';

export class DocumentReference {
  public static parse(str: string): DocumentReference {
    const parts = str.trim().split(':');
    const [ref, variant] = [parts[0], parts[1] ?? undefined];
    const path = ref.split('/');

    const store: string = path.shift()!;
    const docId: string | undefined = path.pop();

    return new DocumentReference(store, path, docId, variant);
  }

  constructor(
    public readonly store: string,
    public readonly path: string[],
    public readonly docId?: string,
    public readonly variant?: string,
  ) {}

  public toString(): string {
    let ref = [this.store, ...this.path, this.docId].filter((token) => token).join('/');
    ref += this.variant ? ':' + this.variant : '';
    return ref;
  }
}

export const refValidator: Validator<string> = (value: string) => {
  const raw = value.trim();
  if (!raw) {
    return ValidationResult.invalid('Reference cannot be empty string.');
  }

  const parts = raw.split(':');
  const [ref, variant] = [parts[0], parts[1] ?? undefined];
  const path = ref.split('/');

  if (!path.length) {
    return ValidationResult.invalid('Reference should contain at least store name.');
  }

  const err: string[] = [];

  for (const pathToken of path) {
    if (!idValidator(pathToken).isValid) {
      err.push(`Invalid path token: "${pathToken}"`);
    }
  }

  if (variant != undefined && !idValidator(variant).isValid) {
    err.push(`Invalid variant: "${variant}"`);
  }

  return err.length ? ValidationResult.invalid(...err) : ValidationResult.valid();
};
