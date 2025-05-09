import { AnyParams } from '../../common';
import { Outcome } from '../../defectless';
import { BootstrapError, Layer } from '../../kernel';
import { CmsConfig } from '../../loadables';
import { ContentSchema, PipelineSchema } from '../../model';
import { SapphireModuleClass } from './bootstrap.types';

export interface BootstrapLayer<Config extends AnyParams | undefined = undefined>
  extends Layer<Config> {
  getCmsConfig(): Outcome<CmsConfig, BootstrapError>;
  loadModules(): Outcome<SapphireModuleClass[], BootstrapError>;
  getContentSchemas(): Outcome<ContentSchema[], BootstrapError>;
  getPipelineSchemas(): Outcome<PipelineSchema[], BootstrapError>;
  installPackages(packageNames: string[]): Outcome<void, BootstrapError>;
}
