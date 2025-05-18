import { success, Outcome } from 'defectless';
import { BootstrapError } from '../../kernel';
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

  public getCmsConfig(): Outcome<CmsConfig, BootstrapError> {
    return success(this.cmsConfig);
  }

  public loadModules(): Outcome<SapphireModuleClass[], BootstrapError> {
    return success(this.modules);
  }

  public getContentSchemas(): Outcome<ContentSchema[], BootstrapError> {
    return success(this.contentSchemas);
  }

  public getPipelineSchemas(): Outcome<PipelineSchema[], BootstrapError> {
    return success(this.pipelines);
  }

  public installPackages(_packageNames: string[]): Outcome<void, BootstrapError> {
    // DO NOTHING
    return success(undefined);
  }
}
