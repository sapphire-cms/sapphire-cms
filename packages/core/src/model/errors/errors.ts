import { ContentType } from '../common';
import { ContentValidationResult, DocumentContent } from '../documents';

export class UnknownContentTypeError extends Error {
  public readonly _tag = 'UnknownContentTypeError';

  constructor(contentTypeName: string) {
    super(`Unknown content type: "${contentTypeName}"`);
  }
}

export class MissingDocIdError extends Error {
  public readonly _tag = 'MissingDocIdError';

  constructor(storeType: ContentType, storeName: string) {
    super(`Missing docId to find document in ${storeType} ${storeName}`);
  }
}

export class InvalidDocumentError extends Error {
  public readonly _tag = 'InvalidDocumentError';

  constructor(
    public readonly contentTypeName: string,
    public readonly content: DocumentContent,
    public readonly validationResult: ContentValidationResult,
  ) {
    super(`Invalid document for content type ${contentTypeName}`);
  }
}
