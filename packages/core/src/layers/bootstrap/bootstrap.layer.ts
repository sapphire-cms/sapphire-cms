import { ResultAsync } from 'neverthrow';
import { AnyParams } from '../../common';
import { BootstrapError, Layer } from '../../kernel';
import { CmsConfig } from '../../loadables';
import { ContentSchema, PipelineSchema } from '../../model';
import { SapphireModuleClass } from './bootstrap.types';

export interface BootstrapLayer<Config extends AnyParams | undefined = undefined>
  extends Layer<Config> {
  getCmsConfig(): ResultAsync<CmsConfig, BootstrapError>;
  loadModules(): ResultAsync<SapphireModuleClass[], BootstrapError>;
  getContentSchemas(): ResultAsync<ContentSchema[], BootstrapError>;
  getPipelineSchemas(): ResultAsync<PipelineSchema[], BootstrapError>;
  installPackages(packageNames: string[]): ResultAsync<void, BootstrapError>;
}
