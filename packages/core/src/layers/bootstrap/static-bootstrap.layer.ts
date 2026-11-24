import { success, Outcome } from 'defectless';
import { BootstrapError } from '../../kernel';
import { CmsConfig, ContentSchema, PipelineSchema, ShaperSchema, WebModule } from '../../model';
import { BootstrapLayer, LoadedPreset } from './bootstrap.layer';
import { SapphireModuleClass } from './bootstrap.types';

export class StaticBootstrapLayer implements BootstrapLayer {
  constructor(
    private readonly cmsConfig: CmsConfig,
    private readonly modules: SapphireModuleClass[],
    private readonly contentSchemas: ContentSchema[],
    private readonly pipelines: PipelineSchema[],
    private readonly shapers: ShaperSchema[],
    private readonly webModules: WebModule[],
    private readonly presets: LoadedPreset[],
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

  public getShaperSchemas(): Outcome<ShaperSchema[], BootstrapError> {
    return success(this.shapers);
  }

  public getWebModules(): Outcome<WebModule[], BootstrapError> {
    return success(this.webModules);
  }

  public getPresets(): Outcome<LoadedPreset[], BootstrapError> {
    return success(this.presets);
  }

  public installPackages(_packageNames: string[]): Outcome<void, BootstrapError> {
    // DO NOTHING
    return success();
  }

  public removePackages(_packageNames: string[]): Outcome<void, BootstrapError> {
    // DO NOTHING
    return success();
  }
}
