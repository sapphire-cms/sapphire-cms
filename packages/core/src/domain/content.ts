export enum ContentStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
}

export interface Content {
  id: string;
  type: string;
}
