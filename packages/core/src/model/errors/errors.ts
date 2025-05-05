import { ContentType } from '../common';
import { ContentValidationResult, DocumentContent } from '../documents';

export abstract class DomainError extends Error {
  public abstract _tag: string;

  protected constructor(message: string) {
    super(message);
  }
}

export class UnknownContentTypeError extends DomainError {
  public readonly _tag = 'UnknownContentTypeError';

  constructor(contentTypeName: string) {
    super(`Unknown content type: "${contentTypeName}"`);
  }
}

export class MissingDocIdError extends DomainError {
  public readonly _tag = 'MissingDocIdError';

  constructor(storeType: ContentType, storeName: string) {
    super(`Missing docId to find document in ${storeType} ${storeName}`);
  }
}

export class InvalidDocumentError extends DomainError {
  public readonly _tag = 'InvalidDocumentError';

  constructor(
    public readonly contentTypeName: string,
    public readonly content: DocumentContent,
    public readonly validationResult: ContentValidationResult,
  ) {
    super(`Invalid document for content type ${contentTypeName}`);
  }
}
