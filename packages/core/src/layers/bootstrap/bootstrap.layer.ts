import {Layer} from '../../kernel';
import {CmsConfig} from '../../loadables';
import {SapphireModuleClass} from './bootstrap.types';
import {ContentSchema, PipelineSchema} from '../../model';

export interface BootstrapLayer<Config> extends Layer<Config> {
  getCmsConfig(): Promise<CmsConfig>;
  loadModules(): Promise<SapphireModuleClass<any, any>[]>;
  getContentSchemas(): Promise<ContentSchema[]>;
  getPipelineSchemas(): Promise<PipelineSchema[]>;
  installPackages(packageNames: string[]): Promise<void>;
}
