import {AnyParams} from '../../common';
import {Layer} from '../../kernel';
import {CmsConfig} from '../../loadables';
import {ContentSchema, PipelineSchema} from '../../model';
import {SapphireModuleClass} from './bootstrap.types';

export interface BootstrapLayer<Config extends AnyParams | undefined = undefined> extends Layer<Config> {
  getCmsConfig(): Promise<CmsConfig>;
  loadModules(): Promise<SapphireModuleClass[]>;
  getContentSchemas(): Promise<ContentSchema[]>;
  getPipelineSchemas(): Promise<PipelineSchema[]>;
  installPackages(packageNames: string[]): Promise<void>;
}
