import { success, Outcome } from 'defectless';
import { AnyParams } from '../../common';
import { BootstrapError, CmsConfig, WebModule } from '../../kernel';
import { ContentSchema, PipelineSchema } from '../../model';
import { BootstrapLayer } from './bootstrap.layer';
import { SapphireModuleClass } from './bootstrap.types';

export class CmsBootstrapLayer implements BootstrapLayer {
  constructor(
    private readonly delegate: BootstrapLayer<AnyParams>,
    private readonly cmsConfig: CmsConfig,
    private readonly loadedModules: SapphireModuleClass[],
  ) {}

  public getCmsConfig(): Outcome<CmsConfig, BootstrapError> {
    return success(this.cmsConfig);
  }

  public loadModules(): Outcome<SapphireModuleClass[], BootstrapError> {
    return success(this.loadedModules);
  }

  public getContentSchemas(): Outcome<ContentSchema[], BootstrapError> {
    return this.delegate.getContentSchemas();
  }

  public getPipelineSchemas(): Outcome<PipelineSchema[], BootstrapError> {
    return this.delegate.getPipelineSchemas();
  }

  public getWebModules(): Outcome<WebModule[], BootstrapError> {
    return this.delegate.getWebModules();
  }

  public installPackages(packageNames: string[]): Outcome<void, BootstrapError> {
    return this.delegate.installPackages(packageNames);
  }

  public removePackages(packageNames: string[]): Outcome<void, BootstrapError> {
    return this.delegate.removePackages(packageNames);
  }
}
