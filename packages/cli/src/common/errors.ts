import { OuterError } from '@sapphire-cms/core';

export class ProcessError extends OuterError {
  public readonly _tag = 'ProcessError';

  constructor(message: string, cause?: unknown) {
    super(message, cause);
  }
}

export class CmsConfigMissingError extends OuterError {
  public readonly _tag = 'CmsConfigMissingError';

  constructor(invocationDir: string) {
    super(`Folder ${invocationDir} do not contains CMS config file sapphire-cms.config.yaml`);
  }
}

export class TextFormParseError extends OuterError {
  public readonly _tag = 'TextFormParseError';

  constructor(cause?: unknown) {
    super('Failed to parse TextForm', cause);
  }
}
