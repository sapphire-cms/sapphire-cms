import {ContentType} from '../common';

export enum DocumentStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
}

type ScalarValue = string | number | boolean;

type RecursiveValue = ScalarValue
    | ScalarValue[]
    | undefined
    | { [key: string]: RecursiveValue }
    | { [key: string]: RecursiveValue }[];

export type DocumentContent = Record<
    string,
    ScalarValue
      | ScalarValue[]
      | undefined>;

export type DocumentContentInlined = Record<string, RecursiveValue>;

export interface Document<T extends DocumentContent | DocumentContentInlined = DocumentContent> {
  id: string;
  store: string;
  path: string[];
  type: ContentType;
  variant: string;
  status: DocumentStatus;
  createdAt: string;
  lastModifiedAt: string;
  createdBy: string;  // Persistence layer name@version
  content: T;
}
