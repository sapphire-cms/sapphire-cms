import {Layer} from '../../kernel';
import {ContentSchema} from '../../loadables';
import {Module} from './bootstrap.types';

export interface BootstrapLayer<Config> extends Layer<Config> {
  loadModules(): Promise<Module<any, any>[]>;
  getAllSchemas(): Promise<ContentSchema[]>;
}
