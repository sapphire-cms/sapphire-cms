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

// TODO: Persistence layer version
export interface Document<T> {
  id?: string;
  store: string;
  type: ContentType;
  status: DocumentStatus;
  createdAt: string;
  lastModifiedAt: string;
  content: T;
}
