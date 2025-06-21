import { Outcome } from 'defectless';
import { AnyParams } from '../../common';
import { BootstrapError, CmsConfig, Layer, WebModule } from '../../kernel';
import { ContentSchema, PipelineSchema } from '../../model';
import { SapphireModuleClass } from './bootstrap.types';

export interface BootstrapLayer<Config extends AnyParams | undefined = undefined>
  extends Layer<Config> {
  getCmsConfig(): Outcome<CmsConfig, BootstrapError>;
  loadModules(): Outcome<SapphireModuleClass[], BootstrapError>;
  getContentSchemas(): Outcome<ContentSchema[], BootstrapError>;
  getPipelineSchemas(): Outcome<PipelineSchema[], BootstrapError>;
  getWebModules(): Outcome<WebModule[], BootstrapError>;
  installPackages(packageNames: string[]): Outcome<void, BootstrapError>;
  removePackages(packageNames: string[]): Outcome<void, BootstrapError>;
}
