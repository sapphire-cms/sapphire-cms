export enum ContentType {

  /**
   * A single, unique document. Not meant to be duplicated or listed.
   */
  SINGLETON = 'singleton',

  /**
   * A flat list (array) of content entries of the same type.
   */
  COLLECTION = 'collection',

  /**
   * A hierarchical structure of content, similar to a file system.
   */
  TREE = 'tree',
}

export interface FieldTypeSchema {
  name: string;
  params?: { [key: string]: string | number | boolean | (string | number | boolean)[] };
}
export interface ValidatorSchema {
  name: string;
  params?: { [key: string]: string | number | boolean };
}

export interface FieldSchema {
  name: string;
  label?: string;
  description?: string;
  type: string | FieldTypeSchema;
  required?: boolean;
  validation?: (string | ValidatorSchema)[];
}

export interface ContentSchema {
  name: string;
  type: ContentType;
  fields: FieldSchema[];
}
