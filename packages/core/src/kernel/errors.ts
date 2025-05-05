export abstract class OuterError extends Error {
  public abstract _tag: string;

  protected constructor(message: string, cause?: unknown) {
    super(message, { cause });
  }

  public wrapIn<T extends OuterError>(errorClass: new (message: string, cause?: unknown) => T): T {
    return new errorClass(this.message, this);
  }
}

// TODO: move to commons and match both inner and outer errors
type ErrorMatcher<T> = {
  [K in OuterError['_tag']]?: (err: Extract<OuterError, { _tag: K }>) => T;
} & {
  _: (err: OuterError) => T; // fallback
};

export function matchError<T>(err: OuterError, matcher: ErrorMatcher<T>): T {
  const handler = matcher[err._tag as keyof typeof matcher] as ((e: OuterError) => T) | undefined;
  return handler ? handler(err) : matcher._(err);
}

export class BootstrapError extends OuterError {
  public readonly _tag = 'BootstrapError';

  constructor(message: string, cause?: unknown) {
    super(message, cause);
  }
}

export class PersistenceError extends OuterError {
  public readonly _tag = 'PersistenceError';

  constructor(message: string, cause?: unknown) {
    super(message, cause);
  }
}

export class RenderError extends OuterError {
  public readonly _tag = 'RenderError';

  constructor(message: string, cause?: unknown) {
    super(message, cause);
  }
}

export class DeliveryError extends OuterError {
  public readonly _tag = 'DeliveryError';

  constructor(message: string, cause?: unknown) {
    super(message, cause);
  }
}
