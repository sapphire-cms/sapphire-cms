import {ContentSchema} from '../model/content-schema';

export interface HostingLayer {
  getAllSchemas(): Promise<ContentSchema[]>;
}
