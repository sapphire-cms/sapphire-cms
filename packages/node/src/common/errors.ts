import { OuterError } from '@sapphire-cms/core';

export class FsError extends OuterError {
  public readonly _tag = 'FsError';

  constructor(message: string, cause?: unknown) {
    super(message, cause);
  }
}

export class YamlParsingError extends OuterError {
  public readonly _tag = 'YamlParsingError';

  constructor(message: string, cause?: unknown) {
    super(message, cause);
  }
}

export class JsonParsingError extends OuterError {
  public readonly _tag = 'JsonParsingError';

  constructor(message: string, cause?: unknown) {
    super(message, cause);
  }
}
