import { ValidationResult } from '../../common';
import { DocumentReference } from '../../kernel';
import { ContentType } from '../common';

export enum DocumentStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
}

export type ScalarValue = string | number | boolean;

export type RecursiveValue =
  | ScalarValue
  | ScalarValue[]
  | undefined
  | { [key: string]: RecursiveValue }
  | { [key: string]: RecursiveValue }[];

export type DocumentContent = Record<string, ScalarValue | ScalarValue[] | undefined>;

export type DocumentContentInlined = Record<string, RecursiveValue>;

export interface Document<T extends DocumentContent | DocumentContentInlined = DocumentContent> {
  id: string;
  store: string;
  path: string[];
  variant: string;
  type: ContentType;
  status: DocumentStatus;
  createdAt: string;
  lastModifiedAt: string;
  createdBy: string; // Persistence layer name@version
  content: T;
}

export type DocumentInfo = {
  store: string;
  path: string[];
  docId?: string;
  variants: string[];
};

export type FieldsValidationResult<T extends DocumentContent = DocumentContent> = {
  [K in keyof T]: ValidationResult[]; // simple field contains one result, a list field one result per list item
};

export function documentRef<T extends DocumentContent | DocumentContentInlined = DocumentContent>(
  doc: Document<T>,
): DocumentReference {
  return new DocumentReference(doc.store, doc.path, doc.id, doc.variant);
}

export class ContentValidationResult<T extends DocumentContent = DocumentContent> {
  constructor(public readonly fields: FieldsValidationResult<T>) {}

  public get isValid(): boolean {
    return Object.values(this.fields)
      .flatMap((fieldResults) => fieldResults)
      .every((validationResult) => validationResult.isValid);
  }
}

export type ContentValidator<T extends DocumentContent = DocumentContent> = (
  content: T,
) => ContentValidationResult<T>;
