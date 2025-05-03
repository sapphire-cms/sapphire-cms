export class PersistenceError extends Error {
  public readonly _tag = 'PersistenceError';

  constructor(message: string, cause?: unknown) {
    super(message, { cause });
  }
}

export class DeliveryError extends Error {
  public readonly _tag = 'DeliveryError';

  constructor(message: string, cause?: unknown) {
    super(message, { cause });
  }
}
