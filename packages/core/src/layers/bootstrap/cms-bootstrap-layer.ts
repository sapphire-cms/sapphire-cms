import {AnyParams} from '../../common';
import {CmsConfig} from '../../loadables';
import {ContentSchema, PipelineSchema} from '../../model';
import {BootstrapLayer} from './bootstrap.layer';
import {SapphireModuleClass} from './bootstrap.types';

export class CmsBootstrapLayer implements BootstrapLayer {
  constructor(private readonly delegate: BootstrapLayer<AnyParams>,
              private readonly cmsConfig: CmsConfig,
              private readonly loadedModules: SapphireModuleClass[]) {
  }

  getCmsConfig(): Promise<CmsConfig> {
    return Promise.resolve(this.cmsConfig);
  }

  loadModules(): Promise<SapphireModuleClass[]> {
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
