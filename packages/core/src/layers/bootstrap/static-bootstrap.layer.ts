import {BootstrapLayer} from './bootstrap.layer';
import {CmsConfig} from '../../loadables';
import {SapphireModuleClass} from './bootstrap.types';
import {ContentSchema, PipelineSchema} from '../../model';

export class StaticBootstrapLayer implements BootstrapLayer<void> {
  constructor(private readonly cmsConfig: CmsConfig,
              private readonly modules: SapphireModuleClass<any, any>[],
              private readonly contentSchemas: ContentSchema[],
              private readonly pipelines: PipelineSchema[]) {
  }

  getCmsConfig(): Promise<CmsConfig> {
    return Promise.resolve(this.cmsConfig);
  }

  loadModules(): Promise<SapphireModuleClass<any, any>[]> {
    return Promise.resolve(this.modules);
  }

  getContentSchemas(): Promise<ContentSchema[]> {
    return Promise.resolve(this.contentSchemas);
  }

  getPipelineSchemas(): Promise<PipelineSchema[]> {
    return Promise.resolve(this.pipelines);
  }

  installPackages(packageNames: string[]): Promise<void> {
    // DO NOTHING
    return Promise.resolve();
  }
}
