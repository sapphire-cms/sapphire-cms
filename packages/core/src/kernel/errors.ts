import { Throwable } from '../common';

export abstract class OuterError extends Throwable {
  public abstract _tag: string;

  public wrapIn<T extends OuterError>(errorClass: new (message: string, cause?: unknown) => T): T {
    return new errorClass(this.message, this);
  }
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
