import { ContentValidationResult, DocumentContent } from '../model';

export class UnknownContentTypeError {
  public readonly _tag = 'UnknownContentTypeError';
  public readonly message: string;

  constructor(contentTypeName: string) {
    this.message = `Unknown content type: "${contentTypeName}"`;
  }
}

export class MissingDocIdError {
  public readonly _tag = 'MissingDocIdError';

  constructor(public readonly context: string) {}
}

export class InvalidDocumentError {
  public readonly _tag = 'InvalidDocumentError';

  constructor(
    public readonly contentTypeName: string,
    public readonly content: DocumentContent,
    public readonly validationResult: ContentValidationResult,
  ) {}
}
