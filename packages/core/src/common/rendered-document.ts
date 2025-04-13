import {DocumentReference} from './references';

export type RenderedDocument = {
  ref: DocumentReference;
  createdAt: string;
  lastModifiedAt: string;
  mime: string;
  content: Uint8Array<any>;
};
