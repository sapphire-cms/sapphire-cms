import { failure, Outcome, success } from 'defectless';
import { AnyParams } from '../../common';
import { BootstrapError, Layer } from '../../kernel';
import {
  CmsConfig,
  ContentSchema,
  overloadCmsConfig,
  PipelineSchema,
  ShaperSchema,
  WebModule,
} from '../../model';
import { SapphireModuleClass } from './bootstrap.types';

export interface BootstrapLayer<Config extends AnyParams | undefined = undefined>
  extends Layer<Config> {
  getCmsConfig(configRef?: string): Outcome<CmsConfig, BootstrapError>;
  loadModules(): Outcome<SapphireModuleClass[], BootstrapError>;
  getContentSchemas(): Outcome<ContentSchema[], BootstrapError>;
  getPipelineSchemas(): Outcome<PipelineSchema[], BootstrapError>;
  getShaperSchemas(): Outcome<ShaperSchema[], BootstrapError>;
  getWebModules(): Outcome<WebModule[], BootstrapError>;
  installPackages(packageNames: string[]): Outcome<void, BootstrapError>;
  removePackages(packageNames: string[]): Outcome<void, BootstrapError>;
}

export function loadCmsConfig(
  bootstrapLayer: BootstrapLayer<AnyParams>,
  configRef?: string,
  profile?: string,
): Outcome<CmsConfig, BootstrapError> {
  return bootstrapLayer
    .getCmsConfig(configRef)
    .flatMap((config) => {
      if (config.extends) {
        return loadCmsConfig(bootstrapLayer, config.extends).map((baseConfig) =>
          overloadCmsConfig(baseConfig, config),
        );
      } else {
        return success(config);
      }
    })
    .through((config) => {
      if (profile && profile != config.profile) {
        return failure(
          new BootstrapError(
            `Profile mismatch: loaded CMS config in file missing entry 'profile: ${config.profile}'`,
          ),
        );
      }

      return success();
    });
}
