export enum ContentType {

  /**
   * A single, unique document. Not meant to be duplicated or listed.
   */
  SINGLETON = 'singleton',

  /**
   * A flat list (array) of documents of the same type.
   */
  COLLECTION = 'collection',

  /**
   * A hierarchical structure of documents, similar to a file system.
   */
  TREE = 'tree',
}

export enum DocumentStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
}

export type DocumentContent = Record<
    string,
    string
      | number
      | boolean
      | undefined
      | (string | number | boolean)[]>;

// TODO: probably don't need to be generic
export interface Document<T extends DocumentContent> {
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
