import { okAsync, ResultAsync } from 'neverthrow';
import { AnyParams } from '../../common';
import { BootstrapError } from '../../kernel';
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

  public getCmsConfig(): ResultAsync<CmsConfig, BootstrapError> {
    return okAsync(this.cmsConfig);
  }

  public loadModules(): ResultAsync<SapphireModuleClass[], BootstrapError> {
    return okAsync(this.loadedModules);
  }

  public getContentSchemas(): ResultAsync<ContentSchema[], BootstrapError> {
    return this.delegate.getContentSchemas();
  }

  public getPipelineSchemas(): ResultAsync<PipelineSchema[], BootstrapError> {
    return this.delegate.getPipelineSchemas();
  }

  public installPackages(packageNames: string[]): ResultAsync<void, BootstrapError> {
    return this.delegate.installPackages(packageNames);
  }
}
