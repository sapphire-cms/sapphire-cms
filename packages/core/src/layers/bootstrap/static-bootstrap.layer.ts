import { okAsync, ResultAsync } from 'neverthrow';
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

  public getCmsConfig(): ResultAsync<CmsConfig, BootstrapError> {
    return okAsync(this.cmsConfig);
  }

  public loadModules(): ResultAsync<SapphireModuleClass[], BootstrapError> {
    return okAsync(this.modules);
  }

  public getContentSchemas(): ResultAsync<ContentSchema[], BootstrapError> {
    return okAsync(this.contentSchemas);
  }

  public getPipelineSchemas(): ResultAsync<PipelineSchema[], BootstrapError> {
    return okAsync(this.pipelines);
  }

  public installPackages(_packageNames: string[]): ResultAsync<void, BootstrapError> {
    // DO NOTHING
    return okAsync(undefined);
  }
}
