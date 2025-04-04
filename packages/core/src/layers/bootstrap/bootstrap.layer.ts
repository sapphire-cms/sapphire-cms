import {Layer} from '../../kernel';
import {ContentSchema} from '../../loadables';
import {SapphireModuleClass} from './bootstrap.types';

export interface BootstrapLayer<Config> extends Layer<Config> {
  loadModules(): Promise<SapphireModuleClass<any, any>[]>;
  getAllSchemas(): Promise<ContentSchema[]>;
}
