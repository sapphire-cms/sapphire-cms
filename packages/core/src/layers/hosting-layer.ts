import {DocumentSchema} from '../model/document-schema';

export interface HostingLayer {
  getAllSchemas(): Promise<DocumentSchema[]>;
}
