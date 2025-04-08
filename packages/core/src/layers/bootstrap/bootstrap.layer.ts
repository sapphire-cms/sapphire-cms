import {Layer} from '../../kernel';
import {CmsConfig, ContentSchema} from '../../loadables';
import {SapphireModuleClass} from './bootstrap.types';

export interface BootstrapLayer<Config> extends Layer<Config> {
  getCmsConfig(): Promise<CmsConfig>;
  loadModules(): Promise<SapphireModuleClass<any, any>[]>;
  getAllContentSchemas(): Promise<ContentSchema[]>;
  installPackages(packageNames: string[]): Promise<void>;
}
