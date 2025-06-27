import { Throwable, ValidationResult } from '../../common';
import { ContentType } from '../common';
import { ContentValidationResult, DocumentContent, DocumentReference } from '../documents';

export abstract class DomainError extends Throwable {
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

export class UnsupportedContentVariant extends DomainError {
  public readonly _tag = 'UnsupportedContentVariant';

  constructor(variant: string) {
    super(`Unsupported content variant: "${variant}"`);
  }
}

export class MissingDocumentError extends DomainError {
  public readonly _tag = 'MissingDocumentError';

  constructor(docRef: DocumentReference) {
    super(`Failed to find document ${docRef.toString()}`);
  }
}

export class DocumentAlreadyExistError extends DomainError {
  public readonly _tag = 'DocumentAlreadyExistError';

  constructor(docRef: DocumentReference) {
    super(`Document ${docRef.toString()} already exist`);
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

export class InvalidDocumentReferenceError extends DomainError {
  public readonly _tag = 'InvalidDocumentReferenceError';

  constructor(
    str: string,
    public readonly validationResult: ValidationResult,
  ) {
    super(`String ${str} is not a valid document reference`);
  }
}

// TODO: find use cases for them or remove
export class InvalidModuleReferenceError extends DomainError {
  public readonly _tag = 'InvalidModuleReferenceError';

  constructor(str: string) {
    super(`String ${str} is not a valid module reference`);
  }
}

export class UnknownFieldTypeError extends DomainError {
  public readonly _tag = 'UnknownFieldTypeError';

  constructor(fieldTypeName: string) {
    super(`Unknown field type: "${fieldTypeName}"`);
  }
}

export class UnknownFieldValidatorError extends DomainError {
  public readonly _tag = 'UnknownFieldValidatorError';

  constructor(fieldValidatorName: string) {
    super(`Unknown field validator: "${fieldValidatorName}"`);
  }
}

export class UnknownRendererError extends DomainError {
  public readonly _tag = 'UnknownRendererError';

  constructor(rendererName: string) {
    super(`Unknown renderer: "${rendererName}"`);
  }
}

export class UnknownDeliveryLayerError extends DomainError {
  public readonly _tag = 'UnknownDeliveryLayerError';

  constructor(deliveryLayerName: string) {
    super(`Unknown delivery layer: "${deliveryLayerName}"`);
  }
}
