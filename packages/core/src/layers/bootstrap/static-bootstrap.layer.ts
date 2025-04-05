import {BootstrapLayer} from './bootstrap.layer';
import {CmsConfig, ContentSchema} from '../../loadables';
import {SapphireModuleClass} from './bootstrap.types';

export class StaticBootstrapLayer implements BootstrapLayer<void> {
  constructor(private readonly cmsConfig: CmsConfig,
              private readonly modules: SapphireModuleClass<any, any>[],
              private readonly contentSchemas: ContentSchema[]) {
  }

  getCmsConfig(): Promise<CmsConfig> {
    return Promise.resolve(this.cmsConfig);
  }

  loadModules(): Promise<SapphireModuleClass<any, any>[]> {
    return Promise.resolve(this.modules);
  }

  getAllSchemas(): Promise<ContentSchema[]> {
    return Promise.resolve(this.contentSchemas);
  }

  installPackages(packageNames: string[]): Promise<void> {
    // DO NOTHING
    return Promise.resolve();
  }
}
