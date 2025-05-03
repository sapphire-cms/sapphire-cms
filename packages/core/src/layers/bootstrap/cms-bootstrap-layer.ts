import { AnyParams } from '../../common';
import { CmsConfig } from '../../loadables';
import { ContentSchema, PipelineSchema } from '../../model';
import { BootstrapLayer } from './bootstrap.layer';
import { SapphireModuleClass } from './bootstrap.types';

export class CmsBootstrapLayer implements BootstrapLayer {
  constructor(
    private readonly delegate: BootstrapLayer<AnyParams>,
    private readonly cmsConfig: CmsConfig,
    private readonly loadedModules: SapphireModuleClass[],
  ) {}

  public getCmsConfig(): Promise<CmsConfig> {
    return Promise.resolve(this.cmsConfig);
  }

  public loadModules(): Promise<SapphireModuleClass[]> {
    return Promise.resolve(this.loadedModules);
  }

  public getContentSchemas(): Promise<ContentSchema[]> {
    return this.delegate.getContentSchemas();
  }

  public getPipelineSchemas(): Promise<PipelineSchema[]> {
    return this.delegate.getPipelineSchemas();
  }

  public installPackages(packageNames: string[]): Promise<void> {
    return this.delegate.installPackages(packageNames);
  }
}
