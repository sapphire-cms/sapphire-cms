import { CmsConfig } from '../../loadables';
import { ContentSchema, PipelineSchema } from '../../model';
import { BootstrapLayer } from './bootstrap.layer';
import { SapphireModuleClass } from './bootstrap.types';

export class StaticBootstrapLayer implements BootstrapLayer {
  constructor(
    private readonly cmsConfig: CmsConfig,
    private readonly modules: SapphireModuleClass[],
    private readonly contentSchemas: ContentSchema[],
    private readonly pipelines: PipelineSchema[],
  ) {}

  public getCmsConfig(): Promise<CmsConfig> {
    return Promise.resolve(this.cmsConfig);
  }

  public loadModules(): Promise<SapphireModuleClass[]> {
    return Promise.resolve(this.modules);
  }

  public getContentSchemas(): Promise<ContentSchema[]> {
    return Promise.resolve(this.contentSchemas);
  }

  public getPipelineSchemas(): Promise<PipelineSchema[]> {
    return Promise.resolve(this.pipelines);
  }

  public installPackages(_packageNames: string[]): Promise<void> {
    // DO NOTHING
    return Promise.resolve();
  }
}
