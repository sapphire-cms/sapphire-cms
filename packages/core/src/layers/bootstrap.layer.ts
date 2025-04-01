import {ContentSchema} from '../model/content-schema';
import {Layer} from './layer';

export interface BootstrapLayer<Config> extends Layer<Config> {
  getAllSchemas(): Promise<ContentSchema[]>;
}
