export enum ContentStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
}

export enum FieldType {
  NUMBER = 'number',
  BOOLEAN = 'boolean',
  REFERENCE = 'reference',
  TEXT = 'text',
  RICH_TEXT = 'rich-text',
  LOCAL_DATE = 'local-date',
  LOCAL_TIME = 'local-time',
  ISO_DATE_TIME = 'iso-date-time',
  TAG = 'tag',
  MEDIA = 'media',
}

export interface Content {
  id: string;
  type: string ;
}
