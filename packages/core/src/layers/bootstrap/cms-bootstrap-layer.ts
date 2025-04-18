import {BootstrapLayer} from './bootstrap.layer';
import {SapphireModuleClass} from './bootstrap.types';
import {CmsConfig} from '../../loadables';
import {ContentSchema, PipelineSchema} from '../../common';

export class CmsBootstrapLayer<Config> implements BootstrapLayer<Config> {
  constructor(private readonly delegate: BootstrapLayer<Config>,
              private readonly cmsConfig: CmsConfig,
              private readonly loadedModules: SapphireModuleClass<any, any>[]) {
  }

  getCmsConfig(): Promise<CmsConfig> {
    return Promise.resolve(this.cmsConfig);
  }

  loadModules(): Promise<SapphireModuleClass<any, any>[]> {
    return Promise.resolve(this.loadedModules);
  }

  getContentSchemas(): Promise<ContentSchema[]> {
    return this.delegate.getContentSchemas();
  }

  getPipelineSchemas(): Promise<PipelineSchema[]> {
    return this.delegate.getPipelineSchemas();
  }

  installPackages(packageNames: string[]): Promise<void> {
    return this.delegate.installPackages(packageNames);
  }
}
