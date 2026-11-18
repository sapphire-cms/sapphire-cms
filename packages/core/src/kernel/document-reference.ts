import { ValidationResult, Validator } from '../common';
import { Id, idValidator, asId } from './id';
import { createSlug, Slug } from './slug';

export class DocumentReference {
  // TODO: will be a CapabilityReference after implementation of presets
  public readonly store: Id;
  public readonly path: Id[];
  public readonly docId?: Id;
  public readonly variant?: Id;

  public static parse(str: string): DocumentReference {
    const parts = str.trim().split(':');
    const [ref, variant] = [parts[0], parts[1] ?? undefined];
    const path = ref.split('/');

    const store: string = path.shift()!;
    const docId: string | undefined = path.pop();

    return new DocumentReference(store, path, docId, variant);
  }

  public static validate: Validator<string> = (value: string) => {
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

  // TODO: should accept `Id`s and not raw strings
  constructor(store: string, path: string[], docId?: string, variant?: string) {
    this.store = asId(store);
    this.path = path.map(asId);
    this.docId = docId ? asId(docId) : undefined;
    this.variant = variant ? asId(variant) : undefined;
  }

  public toSlug(): Slug {
    return createSlug(
      this.store,
      ...this.path,
      ...(this.docId ? [this.docId] : []),
      ...(this.variant ? [this.variant] : []),
    );
  }

  public toString(): string {
    let ref = [this.store, ...this.path, this.docId].filter((token) => token).join('/');
    ref += this.variant ? ':' + this.variant : '';
    return ref;
  }
}
